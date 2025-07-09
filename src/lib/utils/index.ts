/**
 * 검색어에 포함된 내용이 있는지 검사
 * @param item
 * @param diff
 * @returns
 */
export function includes(item: string, diff: string): boolean {
  const replace = (str: string) => str.replace(/ /g, '').toLowerCase()
  return replace(item).includes(replace(diff))
}

/**
 * 금액 comma 처리
 * @param param
 * @returns
 */
export function comma(param: number): string {
  if (!param && param !== 0) return '0'
  return param.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function toSignPrice(price: number) {
  if (Math.sign(price) === -1) return comma(price)
  else return `+${comma(price)}`
}

/**
 * random 문자열 처리
 * @param length
 * @returns
 */
export function randomize(length: number): string {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length))

  return result
}
