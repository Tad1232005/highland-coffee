import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tải dữ liệu bất đồng bộ theo một "khoá" (chuỗi đại diện cho tham số truy vấn).
 *
 * - `loader` phải được bọc bằng useCallback để không tạo vòng lặp.
 * - Trạng thái "đang tải" được suy ra từ khoá đã áp dụng, nên không phải setState
 *   đồng bộ trong thân effect.
 */
export function useAsyncData(loader, key) {
  const [state, setState] = useState({ key: null, data: null, error: '', errorStatus: null })
  const [nonce, setNonce] = useState(0)
  const version = useRef(0)

  useEffect(() => {
    let active = true
    const requestVersion = ++version.current
    Promise.resolve()
      .then(() => loader())
      .then((data) => {
        if (active && requestVersion === version.current) {
          setState({ key, data, error: '', errorStatus: null })
        }
      })
      .catch((error) => {
        if (active && requestVersion === version.current) {
          setState({
            key,
            data: null,
            error: error?.detail ?? 'Không tải được dữ liệu. Thử lại sau.',
            errorStatus: error?.status ?? null,
          })
        }
      })
    return () => {
      active = false
    }
  }, [loader, key, nonce])

  const update = useCallback((next) => {
    // A mutation response supersedes any older read still in flight.
    version.current += 1
    setState((current) => ({
      ...current,
      key,
      data: typeof next === 'function' ? next(current.data) : next,
      error: '',
      errorStatus: null,
    }))
  }, [key])

  /** Tải lại từ nguồn: dùng khi server đã đổi dữ liệu mà bản cập nhật cục bộ không đủ. */
  const reload = useCallback(() => setNonce((current) => current + 1), [])

  return {
    data: state.key === key ? state.data : null,
    error: state.key === key ? state.error : '',
    errorStatus: state.key === key ? state.errorStatus : null,
    loading: state.key !== key,
    update,
    reload,
  }
}
