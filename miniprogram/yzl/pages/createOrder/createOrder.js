var config = require('../../config.js');
var util = require('../../utils/util.js');
var orderUtils = require('../../utils/order.js');
var chargeUtils = require('../../utils/charge.js')
var appInstance = getApp()

const Dialog = require('../../bower_components/zanui-weapp/dist/dialog/dialog')

Page({
  data: {
    time: '',
    startTime: '',
    date: '',
    startDate: '',
    endDate: '',
    address: {},
    isChooseAddress: false,
    submitBtnType: 'not-order',
    productList: [],
    actionsheetShow: false,
    cancelWithMask: true,
    actions: [{
      name: '上门配送',
    }, {
      name: '到店取送',
    }],
    payActionsheetShow: false,
    payActions: [{
      name: '余额支付'
    }, {
      name: '微信支付'
    }],
    isShowPayView: true,
    expressType: 0,
    expressText: '上门配送',
    // 合计栏目显示价格
    price: 0,
    // fixed栏目显示价格
    finalPrice: 0,
    // 运费价格
    expressPrice: 0,
    // 不包含快递的合计价格
    no_express_price: 0,
    // 留言数据
    remark_value: '',
    // 创建订单之后 缓存的订单数据
    orderInfo: {},
    // 是否已经创建订单
    isCreatedOrder: false,
    // 根据是否创建订单 显示提交按钮的文本  提交订单 or 去支付
    submitBtnText: '提交订单',
    // 用户信息
    userInfo: {},
    promotionId: null,
    couponInfo: null,
    couponValue: '无',
    couponType: 0,
    couponConditions: null,
    conponDiscount: null,
    willDiscount: 1
  },
  onReady() {
    console.log('小程序准备好咯')
  },
  onShow() {
    console.log('小程序即将显示')
    var that = this
    try {
      let coupon = wx.getStorageSync('currentCoupon')
      console.log('ccccc: ', coupon)
      if (coupon !== undefined || coupon !== null) {
        that.setData({
          couponInfo: coupon,
          couponValue: coupon.coupon.coupon_name,
          couponType: coupon.coupon.type,
          couponConditions: coupon.coupon.conditions,
          couponDiscount: coupon.coupon.discount
        }, function () {
          console.log('设置好的coupon信息', this.data.couponInfo)
          that.calculatePrice() 
        })
      }
    } catch (e) {
    
    }
  },
  onLoad(option) {
    // 获取购物车的商品数据
    var that = this
    try {
      var cartData = wx.getStorageSync('CART_LIST_DATA')
      if (cartData) {
        that.setData({
          productList: cartData
        }, function () {
          console.log(that.data.productList)
        })
      }
    } catch (e) {
      console.log(e)
    }
    // 获取团购id
    this.getPromotionId(option)
    this.initTimeAndDate()
    // this.calculatePrice()
    this.getUserInfo()
  },
  getPromotionId(option) {
    if (option === undefined) {
      return
    }
    if (option.promotionId === undefined) {
      return
    }
    this.setData({
      promotionId: option.promotionId,
      willDiscount: 0
    })
  },
  /**
   *  初始化配送日期、时间
   */
  initTimeAndDate() {
    var that = this
    // 查询设置取件整点
    var d = new Date()
    var hours = d.getHours()

    // 设置默认取件日期
    var today = util.getDateStr(0)
    var endDate = util.getDateStr(365)
    if (hours < 22 && hours + 2 >= 22) {
      hours = 22
    } else if (hours >= 22) {
      today = util.getDateStr(1)
      endDate = util.getDateStr(4)
      hours = 9
    } else {
      hours += 2
    }
    var time = hours + ':00'
    // 设置取件日期
    that.setData({
      date: today,
      startDate: today,
      endDate: endDate,
      time: time,
      startTime: time
    })
    console.log(hours)
  },
  /**
   *  配送时间修改事件
   */
  bindTimeChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      time: e.detail.value
    })
  },
  /**
   *  配送日期修改事件
   */
  bindDateChange: function (e) {
    var targetDate = e.detail.value
    var today = util.getDateStr(0)
    if (today == targetDate) {
      console.log('就是今天哦 亲！！！')

      var d = new Date()
      var hours = d.getHours()

      // 设置默认取件日期
      if (hours < 22 && hours + 2 >= 22) {
        hours = 22
      } else if (hours >= 22) {
        hours = 22
      } else {
        hours += 2
      }
      var time = hours + ':00'
      // 设置取件日期
      this.setData({
        time: time,
        startTime: time
      })
    }
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      date: e.detail.value
    })
  },
  /**
   *  选择地址事件
   */
  choseAddress() {
    if (this.data.isCreatedOrder === true) {
      wx.showToast({
        title: '订单已创建，地址不能修改',
        icon: 'none',
        duration: 1500
      })
      return
    }
    console.log('choseAddress')
    var that = this
    wx.chooseAddress({
      success: function (res) {
        console.log(res)
        that.setData({
          address: res,
          isChooseAddress: true,
          submitBtnType: 'order'
        }, function () {
          console.log(that.data.isChooseAddress)
        })
      },
      fail: function (res) {
        console.log('地址选择 失败回调')
        if (that.data.isChooseAddress === false) {
          that.setData({
            isChooseAddress: false,
            submitBtnType: 'not-order'
          })
        }
        that.openSetting()
      }
    })
  },
  /**
   *  打开配送方式选择的ActionSheet
   */
  openActionSheet() {
    console.log('openActionSheet')
    this.setData({
      actionsheetShow: true,
      isShowPayView: false
    })
  },
  /**
   *  配送方式选择的监听事件
   */
  handleActionClick({
    detail
  }) {
    const {
      index
    } = detail
    var that = this
    console.log(detail)
    var text = ''
    if (index == 0) {
      text = '上门配送'
    } else {
      text = '到店取送'
    }
    this.setData({
      expressType: index,
      expressText: text,
      actionsheetShow: false,
      isShowPayView: true
    }, function () {
      that.calculatePrice()
    })
  },
  /**
   *  输入表单事件绑定
   */
  handleFieldChange(e) {
    console.log(e)
    let value = e.detail.detail.value
    this.setData({
      remark_value: value
    }, function () {})
  },
  /**
   * 计算商品价格和运费
   */
  calculatePrice() {
    const list = this.data.productList
    console.log('list ---->: ')
    console.log(list)
    let sumPrice = 0.00
    var expressP = 0.00
    for (let i = 0; i < list.length; i++) {
      if (list[i].selectCustom !== null) {
        sumPrice += Number(list[i].selectCustom.price) * list[i].badge
      } else {
        sumPrice += Number(list[i].price) * list[i].badge
      }
    }
    console.log('price: ' + sumPrice.toFixed(2))

    if (sumPrice < 50) {
      expressP = 15.00
    }

    // 到店取送 不计算运费
    if (this.data.expressType === 1) {
      expressP = 0.00
    }

    var finalP = sumPrice + expressP

    // 如果有会员折扣 则在总价上打折
    // 如果不允许打折 则不打折
    if (this.data.willDiscount === 1) {
      var userDiscount = this.data.userInfo.discount
      if (userDiscount !== 100) {
        finalP = finalP * (userDiscount / 100)
      }
    }

    // 如果有优惠券折扣 则在总价上满减
    var couponDiscount = this.data.couponDiscount
    console.log('------> ', couponDiscount)
    if (couponDiscount !== undefined && couponDiscount !== null) {
      var couponConditions = this.data.couponConditions
      if (couponConditions !== undefined && couponConditions !== null) {
        if (this.data.price >= couponConditions) {
          finalP =  finalP - couponDiscount
        }
      }
    }

    this.setData({
      'price': sumPrice.toFixed(2),
      expressPrice: expressP,
      finalPrice: finalP.toFixed(2),
      no_express_price: sumPrice.toFixed(2)
    }, function () {})
  },
  getRemarkData() {
    let value = this.data.expressText + " - 取件时间: " + this.data.date + " " + this.data.time
    if (this.data.remark_value.length > 0) {
      return value + " - " + this.data.remark_value
    } else {
      return value
    }
  },
  /**
   *  创建订单函数
   */
  createOrder(paymentMethod) {
    var that = this

    if (this.data.isCreatedOrder === true) {
      let total_fee = this.data.orderInfo.real_amount * 100
      total_fee = total_fee < 1 ? 1 : total_fee;
      if (paymentMethod === 'wxpay') {
        that.createWxOrder(this.data.orderInfo.trade_no, total_fee)
      } else {
        that.confirmChargePay(this.data.orderInfo.trade_no, this.data.orderInfo.real_amount)
      }
      return
    }

    let orderItems = []
    let sumItemsCount = 0

    for (var i = 0; i < this.data.productList.length; i++) {
      let product = this.data.productList[i]
      sumItemsCount += product.badge
      let custom_option_key = null
      if (product.selectCustomId !== null) {
        custom_option_key = product.selectCustom.custom_option_key
      }
      let item = {
        'product_id': product.id,
        'count': product.badge,
        'custom_option_key': custom_option_key
      }
      orderItems.push(item)
    }

    let couponId = null
    if (this.data.couponInfo !== null && this.data.couponInfo !== undefined) {
      couponId = this.data.couponInfo.coupon_id
    }

    let address = this.data.address
    let data = {
      'items_count': sumItemsCount,
      'order_remark': this.data.remark_value,
      'orderItems': orderItems,
      'userName': address.userName,
      'province': address.provinceName,
      'city': address.cityName,
      'county': address.countyName,
      'street': address.detailInfo,
      'postal_code': address.postalCode,
      'tel_number': address.telNumber,
      'express_type': this.data.expressType,
      'express_date': this.data.date,
      'express_time': this.data.time,
      'promotion_id': this.data.promotionId,
      'coupon_id': couponId,
      'will_discount': this.data.willDiscount,
      'success': function (res) {
        console.log('订单生成 成功的函数回调')
        if (res.trade_no !== undefined && res.real_amount !== undefined) {
          // 第一次在该页生成订单以后，之后再不创建
          that.setData({
            orderInfo: res,
            isCreatedOrder: true,
            submitBtnText: '去支付'
          }, function () {})

          let total_fee = res.real_amount * 100;
          total_fee = total_fee < 1 ? 1 : total_fee;
          if (paymentMethod === 'wxpay') {
            console.log('total_fee: ', total_fee);
            that.createWxOrder(res.trade_no, total_fee)
          } else {
            that.confirmChargePay(res.trade_no, res.real_amount)
          }
        }
      },
      'fail': function (error) {
        console.log('订单生成失败的函数回调')
      }
    }

    console.log(data)
    orderUtils.createOrder(data)
  },
  /**
   * 使用JSAPI 调起微信支付
   */
  createWxPay(res) {
    const params = {
      'data': res,
      'success': function (res) {
        console.log('支付完成后的操作')
      },
      'fail': function (error) {
        console.log('支付失败后的操作')
      }
    }

    orderUtils.createWxPay(params)
  },
  /**
   * 创建微信支付订单，微信支付统一下单接口
   */
  createWxOrder(trade_no, total_fee) {
    var that = this
    // const trade_no1 = "2018060515282019326307"
    // const total_fee1 = 3800
    orderUtils.getPayParams({
      'trade_no': trade_no,
      'total_fee': Math.round(total_fee),
      'type': 1,
      'success': function (res) {
        that.createWxPay(res)
      },
      'fail': function (error) {
        if (typeof error == 'string' || error instanceof String) {
          wx.showToast({
            title: error,
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },
  /**
   *  检查余额是否够用
   */
  checkCharge() {
    var that = this
    console.log(this.data.userInfo.charge)
    console.log(this.data.finalPrice)
    let charge = parseFloat(this.data.userInfo.charge)
    let price = this.data.finalPrice
    if (charge < price) {
      console.log('余额不足，请使用其他支付方式支付')
      this.closePayActionsheet()
      Dialog({
        title: '温馨提醒',
        message: '您的余额不足，请充值后再使用',
        selector: '#zan-dialog-charge',
        buttons: [{
          text: '去充值',
          color: 'red',
          type: 'charge'
        }, {
          text: '确认',
          type: 'confirm'
        }]
      }).then(({type}) => {
        console.log(type)
        if (type === 'charge') {
          that.go2ChargePage()
        }
      })
    } else {
      console.log('余额充足可以使用')
      this.createOrder('charge')
    }
  },
  /**
   *  确认余额支付的逻辑
   */
  confirmChargePay(trade_no, total_fee) {
    console.log('使用余额支付，开始根据订单提示支付')
    console.log(total_fee)

    Dialog({
      title: '提示',
      message: `是否使用余额支付${total_fee}元消费`,
      buttons: [{
        text: '取消',
        type: 'cancel'
      }, {
        text: '确认',
        color: 'red',
        type: 'confirm'
      }],
      selector: '#zan-dialog-charge'
    }).then(({type}) => {
      if (type === 'confirm') {
        this.createChargePay(trade_no, total_fee)
      } else {

      }
    })
  },
  /**
   *  点击余额支付的逻辑
   */
  createChargePay(trade_no, total_fee) {
    orderUtils.createChargePay({
      'trade_no': trade_no,
      'total_fee': total_fee,
      'success': function (res) {
        if (res.code === 200) {
          wx.showToast({
            title: '支付成功',
            icon: 'success',
            duration: 1500
          })
        }
      },
      'fail': function (error) {
        if (typeof error == 'string' || error instanceof String) {
          wx.showToast({
            title: error,
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },
  /**
   *  显示支付ActionSheet弹窗
   */
  showPayActionsheet() {
    this.setData({
      payActionsheetShow: true,
      isShowPayView: false
    })
  },
  /**
   * 支付ActionSheet的点击事件
   */
  handlePayActionClick({ detail }) {
    const {
      index
    } = detail;
    console.log(index)

    if (index === 0) {
      // 余额支付 
      this.checkCharge()
    } else {
      // 微信支付直接创建订单
      this.createOrder('wxpay')
    }

    this.setData({
      payActionsheetShow: false,
      isShowPayView: true
    })
  },
  // 微信支付的取消按钮
  closePayActionsheet() {
    console.log('取消按钮1！！！')
    this.setData({
      payActionsheetShow: false,
      isShowPayView: true
    })
  },
  getUserInfo() {
    var that = this
    chargeUtils.getUserMe({
      'success': function (res) {
        that.setData({
          userInfo: res
        }, function () {
          console.log(that.data.userInfo)
          that.calculatePrice()
        })
      },
      'fail': function (error) {
        console.log('用户信息获取失败')
      }
    })
  },
  // 跳转到优惠券页面
  go2CouponListPage() {
    let price = this.data.price
    wx.navigateTo({
      url: '/pages/couponList/couponList?price=' + price
    })
  },
  openSetting() {
    wx.getSetting({
      success: (res) => {
        console.log(res)
        if (!res.authSetting['scope.address']) {
          wx.showModal({
            title: '提示',
            content: '设置地址，需要开启访问地址信息权限',
            success: function (res) {
              if (res.confirm) {
                //跳转去设置
                wx.openSetting({
                  success: function (res) {
 
                  }
                })
              } else {
                //不设置
              }
            }
          })
        }
      }
    })
  },
  go2ChargePage() {
    wx.navigateTo({
      url: '/pages/charge/charge'
    })
  }
})
