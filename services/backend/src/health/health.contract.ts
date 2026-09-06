/** Process liveness only; does not indicate external dependency readiness. */
export interface LivenessResponse {
  readonly status: 'ok';
}
