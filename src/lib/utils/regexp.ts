export const numberExpression = /^[0-9]+$/
export const emailExpression = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i
export const telExpression = /(01[016789])([1-9]{1}[0-9]{2,3})([0-9]{4})$/
export const telNotHyphenExpression = /([0-9])$/
// export const passwordExpression = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_+=-])[A-Za-z\d\-~!@#$%^&*()_+=-]{8,20}$/
export const passwordExpression = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_+=-])[A-Za-z\d\-~!@#$%^&*()_+=-]{8,32}$/
