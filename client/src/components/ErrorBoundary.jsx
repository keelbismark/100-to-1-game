import React, { Component } from 'react'
import PropTypes from 'prop-types'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    console.error('ErrorBoundary caught an error:', error, errorInfo)

    if (error.message) {
      console.error('Error message:', error.message)
    }

    if (error.stack) {
      console.error('Error stack:', error.stack)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h1>Произошла ошибка</h1>
            <p>Что-то пошло не так. Приносим извинения за неудобства.</p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="error-details">
                <h3>Детали ошибки:</h3>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <>
                    <h4>Стек вызовов:</h4>
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </>
                )}
              </div>
            )}
            
            <button 
              className="error-reset-button" 
              onClick={this.handleReset}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func
}

export default ErrorBoundary
