// test cases for edge cases & bug fixes
var Vue = require('../../../src/vue')

describe('Misc', function () {

  it('should handle directive.bind() altering its childNode structure', function () {
    var vm = new Vue({
      el: document.createElement('div'),
      template: '<div v-test>{{test}}</div>',
      data: {
        test: 'hi'
      },
      directives: {
        test: {
          bind: function () {
            this.el.insertBefore(document.createTextNode('yo '),
              this.el.firstChild)
          }
        }
      }
    })
    expect(vm.$el.textContent).toBe('yo hi')
  })

  it('attached/detached hooks for transcluded components', function () {
    var spy1 = jasmine.createSpy('attached')
    var spy2 = jasmine.createSpy('detached')
    var el = document.createElement('div')
    el.innerHTML = '<outer v-ref="outter"><inner></inner></outer>'
    document.body.appendChild(el)

    var vm = new Vue({
      el: el,
      components: {
        outer: {
          template: '<content></content>'
        },
        inner: {
          template: 'hi',
          attached: spy1,
          detached: spy2
        }
      }
    })
    expect(spy1).toHaveBeenCalled()
    vm.$.outter.$remove()
    expect(spy2).toHaveBeenCalled()
  })

  it('v-repeat on component root node with replace:true', function () {
    var el = document.createElement('div')
    var vm = new Vue({
      el: el,
      template: '<test></test>',
      components: {
        test: {
          data: function () {
            return { list: [1, 2, 3] }
          },
          template: '<div v-repeat="list">{{$value}}</div>',
          replace: true
        }
      }
    })
    expect(vm.$el.innerHTML).toBe('<div>1</div><div>2</div><div>3</div>')
  })

  // #922
  it('template repeat inside svg', function () {
    var el = document.createElement('div')
    new Vue({
      el: el,
      template: '<svg><template v-repeat="list"><text>{{$value}}</text></template></svg>',
      data: {
        list: [1, 2, 3]
      }
    })
    // IE inlines svg namespace
    var xmlns = /\s?xmlns=".*svg"/
    expect(el.innerHTML.replace(xmlns, '')).toBe('<svg><text>1</text><text>2</text><text>3</text></svg>')
  })

  // #1005
  it('call lifecycle hooks for child components', function () {
    Vue.options.replace = true
    var el = document.createElement('div')
    var logs = []
    function log (n) {
      return function () {
        logs.push(n)
      }
    }
    document.body.appendChild(el)
    var vm = new Vue({
      el: el,
      attached: log(0),
      ready: log(1),
      detached: log(2),
      beforeDestroy: log(3),
      destroyed: log(4),
      template: '<div><test></test><test></test></div>',
      components: {
        test: {
          template: '<span>hi</span>',
          attached: log(5),
          ready: log(6),
          detached: log(7),
          beforeDestroy: log(8),
          destroyed: log(9)
        }
      }
    })
    expect(vm.$el.innerHTML).toBe('<span>hi</span><span>hi</span>')
    expect(logs.join()).toBe('0,5,6,5,6,1')
    logs = []
    vm.$destroy(true)
    expect(logs.join()).toBe('3,8,9,8,9,2,7,7,4')
    Vue.options.replace = false
  })

  // #1006
  it('destroyed hook for components inside v-if', function (done) {
    var spy = jasmine.createSpy('v-if destroyed hook')
    var vm = new Vue({
      el: document.createElement('div'),
      template: '<template v-if="ok"><test></test></template>',
      data: {
        ok: true
      },
      components: {
        test: {
          destroyed: spy
        }
      }
    })
    vm.ok = false
    Vue.nextTick(function () {
      expect(spy).toHaveBeenCalled()
      done()
    })
  })

  it('frozen model, root', function (done) {
    var vm = new Vue({
      el: document.createElement('div'),
      template: '{{msg}}',
      data: Object.freeze({
        msg: 'hi!'
      })
    })
    expect(vm.$el.textContent).toBe('hi!')
    vm.msg = 'ho!'
    Vue.nextTick(function () {
      expect(vm.$el.textContent).toBe('hi!')
      done()
    })
  })

  it('frozen model, non-root', function (done) {
    var vm = new Vue({
      el: document.createElement('div'),
      template: '{{msg}} {{frozen.msg}}',
      data: {
        msg: 'hi',
        frozen: Object.freeze({
          msg: 'frozen'
        })
      }
    })
    expect(vm.$el.textContent).toBe('hi frozen')
    vm.msg = 'ho'
    vm.frozen.msg = 'changed'
    Vue.nextTick(function () {
      expect(vm.$el.textContent).toBe('ho frozen')
      done()
    })
  })

})
