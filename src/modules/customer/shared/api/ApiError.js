export class ApiError extends Error {
  constructor(message, { status = 0, data = null, code = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.code = code
  }

  get isNetwork() {
    return this.status === 0
  }
  get isUnauthorized() {
    return this.status === 401
  }
  get isForbidden() {
    return this.status === 403
  }
  get isValidation() {
    return this.status === 422 || this.status === 400
  }
}
export default ApiError
