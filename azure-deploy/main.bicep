// Azure Static Web Apps deployment for Wealth Management Dashboard
// Deploy command: az deployment group create --resource-group <rg> --template-file main.bicep

@description('Name for the Static Web App resource')
param appName string = 'wealth-management-dashboard'

@description('Azure region for deployment')
param location string = 'westeurope'

@description('SKU for the Static Web App (Free or Standard)')
@allowed(['Free', 'Standard'])
param sku string = 'Free'

@description('GitHub repository URL (e.g. https://github.com/<owner>/<repo>)')
param repositoryUrl string

@description('GitHub branch to deploy from')
param branch string = 'main'

@description('GitHub personal access token (for automatic CI/CD setup)')
@secure()
param repositoryToken string = ''

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: appName
  location: location
  sku: {
    name: sku
    tier: sku
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

output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppId string = staticWebApp.id
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
