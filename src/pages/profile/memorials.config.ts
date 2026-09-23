export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的故友'
    })
  : { navigationBarTitleText: '我的故友' };
