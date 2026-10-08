export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '我的', navigationBarBackgroundColor: '#10252f', navigationBarTextStyle: 'white' })
  : { navigationBarTitleText: '我的', navigationBarBackgroundColor: '#10252f', navigationBarTextStyle: 'white' }
