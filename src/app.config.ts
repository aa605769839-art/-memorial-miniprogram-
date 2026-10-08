export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/people/index',
    'pages/memorial/index',
    'pages/profile/index',
    'pages/detail/index',
    'pages/ranking/index',
    'pages/profile/form',
    'pages/profile/memorials',
    'pages/profile/family',
    'pages/profile/calendar',
    'pages/profile/settings',
    'pages/admin/gift-configs/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0e2431',
    navigationBarTitleText: '晚星纪念',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#b0a48f',
    selectedColor: '#6f9b86',
    backgroundColor: '#0e2431',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/home.png',
        selectedIconPath: './assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/people/index',
        text: '故人',
        iconPath: './assets/tabbar/people.png',
        selectedIconPath: './assets/tabbar/people-active.png'
      },
      {
        pagePath: 'pages/memorial/index',
        text: '纪念',
        iconPath: './assets/tabbar/memorial.png',
        selectedIconPath: './assets/tabbar/memorial-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png'
      }
    ]
  }
})