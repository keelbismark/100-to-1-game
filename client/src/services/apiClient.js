class ApiClient {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL
  }

  async request(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      if (data) {
        config.body = JSON.stringify(data)
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async get(endpoint, headers = {}) {
    return this.request('GET', endpoint, null, headers)
  }

  async post(endpoint, data, headers = {}) {
    return this.request('POST', endpoint, data, headers)
  }

  async put(endpoint, data, headers = {}) {
    return this.request('PUT', endpoint, data, headers)
  }

  async delete(endpoint, headers = {}) {
    return this.request('DELETE', endpoint, null, headers)
  }

  async getHealth() {
    try {
      return await this.get('/health')
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }

  async getStats() {
    try {
      return await this.get('/api/stats')
    } catch (error) {
      console.error('Get stats failed:', error)
      throw error
    }
  }
}

const apiClient = new ApiClient('http://localhost:5000')

if (process.env.REACT_APP_API_URL) {
  apiClient.baseURL = process.env.REACT_APP_API_URL
}

export default apiClient
