// Azure deployment for Wealth Management Dashboard
// Provisions: Static Web App, Azure OpenAI (gpt-4o + gpt-4o-mini), Cosmos DB, Blob Storage, Key Vault
// Deploy: az deployment group create --resource-group <rg> --template-file azure-deploy/main.bicep --parameters @azure-deploy/azuredeploy.parameters.json

@description('Base name for all resources (2-20 chars, lowercase letters and hyphens)')
param appName string = 'wealth-mgmt'

@description('Azure region for most resources')
param location string = 'westeurope'

@description('Azure region for Azure OpenAI (must have Azure OpenAI quota; not all regions support it)')
@allowed([
  'eastus'
  'eastus2'
  'swedencentral'
  'westeurope'
  'francecentral'
  'uksouth'
  'northcentralus'
  'australiaeast'
  'canadaeast'
  'japaneast'
])
param openAILocation string = 'swedencentral'

@description('SKU for the Static Web App (Standard required for app settings and managed identity)')
@allowed(['Free', 'Standard'])
param sku string = 'Standard'

@description('GitHub repository URL (e.g. https://github.com/<owner>/<repo>)')
param repositoryUrl string

@description('GitHub branch to deploy from')
param branch string = 'main'

@description('GitHub personal access token (for automatic CI/CD setup)')
@secure()
param repositoryToken string = ''

// ─── Derived resource names ───────────────────────────────────────────────────
var openAIAccountName = '${appName}-openai'
var cosmosAccountName = '${appName}-cosmos'
var storageAccountName = take(replace(toLower(appName), '-', '') + 'storage', 24)
var keyVaultName = take('${appName}-kv', 24)

// ─── Static Web App ───────────────────────────────────────────────────────────
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: appName
  location: location
  sku: {
    name: sku
    tier: sku
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    repositoryToken: repositoryToken
    buildProperties: {
      appLocation: '/'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
  }
}

// ─── Azure OpenAI Service ─────────────────────────────────────────────────────
resource openAI 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: openAIAccountName
  location: openAILocation
  sku: {
    name: 'S0'
  }
  kind: 'OpenAI'
  properties: {
    publicNetworkAccess: 'Enabled'
    customSubDomainName: openAIAccountName
  }
}

@description('GPT-4o-mini deployment — used for bank statement extraction and general AI insights')
resource gpt4oMiniDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: openAI
  name: 'gpt-4o-mini'
  sku: {
    name: 'Standard'
    capacity: 30
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o-mini'
      version: '2024-07-18'
    }
  }
}

@description('GPT-4o deployment — used for detailed bank statement document analysis')
resource gpt4oDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: openAI
  name: 'gpt-4o'
  dependsOn: [gpt4oMiniDeployment]
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-08-06'
    }
  }
}

// ─── Azure Cosmos DB (data persistence) ──────────────────────────────────────
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      { name: 'EnableServerless' }
    ]
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15' = {
  parent: cosmosAccount
  name: 'wealth-management'
  properties: {
    resource: {
      id: 'wealth-management'
    }
  }
}

resource bankStatementsCosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'bank-statements'
  properties: {
    resource: {
      id: 'bank-statements'
      partitionKey: {
        paths: ['/userId']
        kind: 'Hash'
      }
    }
  }
}

resource goalsCosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'goals'
  properties: {
    resource: {
      id: 'goals'
      partitionKey: {
        paths: ['/clientId']
        kind: 'Hash'
      }
    }
  }
}

resource portfoliosCosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'portfolios'
  properties: {
    resource: {
      id: 'portfolios'
      partitionKey: {
        paths: ['/clientId']
        kind: 'Hash'
      }
    }
  }
}

// ─── Azure Blob Storage (bank statement file uploads) ────────────────────────
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource bankStatementsBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'bank-statements'
  properties: {
    publicAccess: 'None'
  }
}

// ─── Azure Key Vault (secrets management) ────────────────────────────────────
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

// Grant the Static Web App's managed identity read access to Key Vault secrets
resource kvSecretReaderRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, staticWebApp.id, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    // Key Vault Secrets User built-in role
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'
    )
    principalId: staticWebApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Store the Azure OpenAI API key
resource openAIKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'openai-api-key'
  properties: {
    value: openAI.listKeys().key1
  }
}

// Store the Cosmos DB primary key
resource cosmosKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'cosmos-primary-key'
  properties: {
    value: cosmosAccount.listKeys().primaryMasterKey
  }
}

// Store the Storage Account connection string
resource storageConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-connection-string'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
  }
}

// ─── Static Web App application settings ─────────────────────────────────────
// Non-secret configuration is stored directly; secrets are referenced from Key Vault
resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2022-09-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    AZURE_OPENAI_ENDPOINT: openAI.properties.endpoint
    AZURE_OPENAI_DEPLOYMENT_GPT4O: gpt4oDeployment.name
    AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI: gpt4oMiniDeployment.name
    // The three settings below reference secrets stored in Key Vault.
    // After deployment, replace these values with Key Vault references using the format:
    //   @Microsoft.KeyVault(SecretUri=https://<vault-name>.vault.azure.net/secrets/<secret-name>/)
    // Secrets available in Key Vault: openai-api-key, cosmos-primary-key, storage-connection-string
    // The Static Web App's managed identity has been granted Key Vault Secrets User access.
    AZURE_OPENAI_API_KEY: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/openai-api-key/)'
    COSMOS_DB_ENDPOINT: cosmosAccount.properties.documentEndpoint
    COSMOS_DB_DATABASE: cosmosDatabase.name
    COSMOS_DB_KEY: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/cosmos-primary-key/)'
    STORAGE_ACCOUNT_NAME: storageAccount.name
    STORAGE_CONTAINER_BANK_STATEMENTS: bankStatementsBlobContainer.name
    STORAGE_CONNECTION_STRING: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/storage-connection-string/)'
    KEY_VAULT_URI: keyVault.properties.vaultUri
  }
}

// ─── Outputs ──────────────────────────────────────────────────────────────────
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppId string = staticWebApp.id
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
output openAIEndpoint string = openAI.properties.endpoint
output openAIDeploymentGpt4o string = gpt4oDeployment.name
output openAIDeploymentGpt4oMini string = gpt4oMiniDeployment.name
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output cosmosDatabase string = cosmosDatabase.name
output keyVaultUri string = keyVault.properties.vaultUri
output storageAccountName string = storageAccount.name
