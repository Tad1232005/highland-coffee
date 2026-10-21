import { useCallback, useEffect, useState } from 'react'

/**
 * Tải dữ liệu bất đồng bộ theo một "khoá" (chuỗi đại diện cho tham số truy vấn).
 *
 * - `loader` phải được bọc bằng useCallback để không tạo vòng lặp.
 * - Trạng thái "đang tải" được suy ra từ khoá đã áp dụng, nên không phải setState
 *   đồng bộ trong thân effect.
 */
export function useAsyncData(loader, key) {
  const [state, setState] = useState({ key: null, data: null, error: '' })

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(() => loader())
      .then((data) => {
        if (active) setState({ key, data, error: '' })
      })
      .catch((error) => {
        if (active) {
          setState({
            key,
            data: null,
            error: error?.detail ?? 'Không tải được dữ liệu. Thử lại sau.',
          })
        }
      })
    return () => {
      active = false
    }
  }, [loader, key])

  const update = useCallback((next) => {
    setState((current) => ({
      ...current,
      data: typeof next === 'function' ? next(current.data) : next,
      error: '',
    }))
  }, [])

  return {
    data: state.key === key ? state.data : null,
    error: state.key === key ? state.error : '',
    loading: state.key !== key,
    update,
  }
}
