export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '排行榜' })
  : { navigationBarTitleText: '排行榜' }
