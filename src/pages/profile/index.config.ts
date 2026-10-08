export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '我的' })
  : { navigationStyle: 'custom', navigationBarTitleText: '我的' }
