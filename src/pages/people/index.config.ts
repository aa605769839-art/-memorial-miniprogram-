export default typeof definePageConfig === 'function'
  ? definePageConfig({
    navigationBarTitleText: '故人',
    navigationStyle: 'custom'
  })
  : {
    navigationBarTitleText: '故人',
    navigationStyle: 'custom'
  }