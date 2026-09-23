export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '添加故人' })
  : { navigationBarTitleText: '添加故人' }
