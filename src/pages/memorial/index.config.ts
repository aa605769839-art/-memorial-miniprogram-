export default typeof definePageConfig === 'function'
  ? definePageConfig({
    navigationBarTitleText: '纪念',
    navigationStyle: 'custom'
  })
  : {
    navigationBarTitleText: '纪念',
    navigationStyle: 'custom'
  }