import superagent from 'superagent'

export async function post<T>(url: string, params: any, headers: object = {}) {
  try {
    const fullUrl = `${import.meta.env.VITE_PUBLIC_BASE_API_URL}${url}`
    let fetchOptions: RequestInit = {
      method: 'POST',
      headers: { ...headers }
    }

    if (params instanceof FormData) {
      fetchOptions.body = params
      // FormData일 때는 Content-Type 자동 설정됨
    } else {
      fetchOptions.body = JSON.stringify(params)
      fetchOptions.headers = {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    const response = await fetch(fullUrl, fetchOptions)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as T
  } catch (e) {
    throw e
  }
}

export async function get<T>(url: string, headers: object = {}) {
  try {
    const fullUrl = `${import.meta.env.VITE_PUBLIC_BASE_API_URL}${url}`
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: { ...headers }
    }

    const response = await fetch(fullUrl, fetchOptions)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as T
  } catch (e) {
    throw e
  }
}
