class ToastNotifier {
  constructor(toaster) {
    this.toaster = toaster;
    this.toasts = [];
    this.maxToasts = 5;
  }

  success(message, options = {}) {
    this.toaster.success(message, options);
  }

  error(message, options = {}) {
    this.toaster.error(message, {
      ...options,
      autoClose: options.autoClose || 5000,
      position: 'top-right'
    });
  }

  warning(message, options = {}) {
    this.toaster.warning(message, options);
  }

  info(message, options = {}) {
    this.toaster.info(message, options);
  }

  clear() {
    this.toaster && this.toaster.clear();
    this.toasts = [];
  }
}

class ErrorHandler {
  constructor(toaster) {
    this.notifier = new ToastNotifier(toaster);
    this.errors = [];
    this.maxErrors = 50;
  }

  handleError(error, context = {}) {
    const errorInfo = {
      message: this.getErrorMessage(error),
      code: this.getErrorCode(error),
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    this.errors.unshift(errorInfo);

    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    console.error('Error occurred:', errorInfo);

    this.notifyUser(errorInfo);
  }

  getErrorMessage(error) {
    if (!error) {
      return 'Неизвестная ошибка';
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.message) {
      return error.message;
    }

    if (error.error) {
      return error.error;
    }

    return 'Произошла ошибка. Попробуйте снова позднее.';
  }

  getErrorCode(error) {
    if (error.code) {
      return error.code;
    }

    if (error.response?.status) {
      return `HTTP_${error.response.status}`;
    }

    if (error.response?.data?.code) {
      return error.response.data.code;
    }

    return 'UNKNOWN';
  }

  notifyUser(errorInfo) {
    let message = errorInfo.message;

    const userFriendlyMessages = {
      'ECONNREFUSED': 'Не удалось подключиться к серверу. Проверьте соединение с интернетом.',
      'ETIMEDOUT': 'Время ожидания истекло. Проверьте соединение.',
      'ENOTFOUND': 'Сервер не найден. Проверьте соединение и попробуйте снова.',
      'HTTP_401': 'Необходимо авторизоваться.',
      'HTTP_403': 'У вас нет прав для выполнения этого действия.',
      'HTTP_404': 'Ресурс не найден.',
      'HTTP_429': 'Слишком много запросов. Попробуйте позже.',
      'HTTP_500': 'Внутренняя ошибка сервера. Попробуйте позже.',
      'VALIDATION_ERROR': errorInfo.message || 'Неверные данные.',
      'NOT_FOUND': 'Ресурс не найден.',
      'UNAUTHORIZED': 'Необходимо авторизоваться.',
      'RATE_LIMIT': 'Слишком много запросов. Попробуйте позже.'
    };

    const friendlyMessage = userFriendlyMessages[errorInfo.code];
    if (friendlyMessage) {
      message = friendlyMessage;
    }

    switch (errorInfo.code) {
      case 'VALIDATION_ERROR':
        this.notifier.warning(message);
        break;
      case 'NOT_FOUND':
        this.notifier.warning(message);
        break;
      case 'UNAUTHORIZED':
        this.notifier.error(message);
        break;
      case 'RATE_LIMIT':
        this.notifier.warning(message);
        break;
      case 'HTTP_429':
        this.notifier.warning(message);
        break;
      case 'HTTP_500':
      case 'HTTP_502':
      case 'HTTP_503':
        this.notifier.error(message);
        break;
      default:
        this.notifier.error(message);
    }
  }

  getRecentErrors(count = 10) {
    return this.errors.slice(0, count);
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorStats() {
    const stats = {};

    this.errors.forEach(error => {
      const code = error.code;
      stats[code] = (stats[code] || 0) + 1;
    });

    return stats;
  }
}

class NetworkError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
    this.originalError = originalError;
  }
}

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class APIError extends Error {
  constructor(message, status, code, response) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.response = response;
  }
}

async function withErrorHandling(promise, context = {}) {
  try {
    const result = await promise;
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error,
      message: error.message || 'Произошла ошибка'
    };
  }
}

async function retryOperation(
  operation,
  maxRetries = 3,
  delay = 1000,
  errorHandler = null
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const shouldRetry =
        attempt < maxRetries &&
        (error.code === 'ECONNREFUSED' ||
         error.code === 'ETIMEDOUT' ||
         error.code === 'ECONNRESET' ||
         error.status >= 500);

      if (!shouldRetry) {
        break;
      }

      if (errorHandler) {
        errorHandler(error, attempt, maxRetries);
      }

      await new Promise(resolve =>
        setTimeout(resolve, delay * attempt)
      );
    }
  }

  throw lastError;
}

export {
  ErrorHandler,
  ToastNotifier,
  NetworkError,
  ValidationError,
  APIError,
  withErrorHandling,
  retryOperation
};

export default ErrorHandler;
