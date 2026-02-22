import { toast as toastifyToast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const toastPositions = {
  TOP_RIGHT: 'top-right',
  TOP_CENTER: 'top-center',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_LEFT: 'bottom-left'
}

const toastTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
}

class Toaster {
  success(message, options = {}) {
    return toastifyToast.success(message, {
      position: toastPositions.TOP_RIGHT,
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'dark',
      ...options
    })
  }

  error(message, options = {}) {
    return toastifyToast.error(message, {
      position: toastPositions.TOP_RIGHT,
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'dark',
      ...options
    })
  }

  warning(message, options = {}) {
    return toastifyToast.warning(message, {
      position: toastPositions.TOP_RIGHT,
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'dark',
      ...options
    })
  }

  info(message, options = {}) {
    return toastifyToast.info(message, {
      position: toastPositions.TOP_RIGHT,
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'dark',
      ...options
    })
  }

  promise(promise, {
    pending = 'Обработка...',
    success = 'Успешно!',
    error = 'Ошибка'
  } = {}) {
    return toastifyToast.promise(
      promise,
      {
        pending,
        success,
        error,
        position: toastPositions.TOP_RIGHT,
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark'
      }
    )
  }

  dismiss(id) {
    toastifyToast.dismiss(id)
  }

  dismissAll() {
    toastifyToast.dismiss()
  }

  active() {
    return toastifyToast.active()
  }
}

const toaster = new Toaster()

export default toaster
