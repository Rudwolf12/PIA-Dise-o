function dropdown(){
    class Dropdown extends BaseComponent {
        constructor(element, config) {
          super(element, config);
          this._popper = null;
          this._parent = this._element.parentNode; // dropdown wrapper
          // TODO: v6 revert #37011 & change markup https://getbootstrap.com/docs/5.3/forms/input-group/
          this._menu = SelectorEngine.next(this._element, SELECTOR_MENU)[0] || SelectorEngine.prev(this._element, SELECTOR_MENU)[0] || SelectorEngine.findOne(SELECTOR_MENU, this._parent);
          this._inNavbar = this._detectNavbar();
        }
    
        // Getters
        static get Default() {
          return Default$9;
        }
        static get DefaultType() {
          return DefaultType$9;
        }
        static get NAME() {
          return NAME$a;
        }
    
        // Public
        toggle() {
          return this._isShown() ? this.hide() : this.show();
        }
        show() {
          if (isDisabled(this._element) || this._isShown()) {
            return;
          }
          const relatedTarget = {
            relatedTarget: this._element
          };
          const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$5, relatedTarget);
          if (showEvent.defaultPrevented) {
            return;
          }
          this._createPopper();
    
          // If this is a touch-enabled device we add extra
          // empty mouseover listeners to the body's immediate children;
          // only needed because of broken event delegation on iOS
          // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
          if ('ontouchstart' in document.documentElement && !this._parent.closest(SELECTOR_NAVBAR_NAV)) {
            for (const element of [].concat(...document.body.children)) {
              EventHandler.on(element, 'mouseover', noop);
            }
          }
          this._element.focus();
          this._element.setAttribute('aria-expanded', true);
          this._menu.classList.add(CLASS_NAME_SHOW$6);
          this._element.classList.add(CLASS_NAME_SHOW$6);
          EventHandler.trigger(this._element, EVENT_SHOWN$5, relatedTarget);
        }
        hide() {
          if (isDisabled(this._element) || !this._isShown()) {
            return;
          }
          const relatedTarget = {
            relatedTarget: this._element
          };
          this._completeHide(relatedTarget);
        }
        dispose() {
          if (this._popper) {
            this._popper.destroy();
          }
          super.dispose();
        }
        update() {
          this._inNavbar = this._detectNavbar();
          if (this._popper) {
            this._popper.update();
          }
        }
    
        // Private
        _completeHide(relatedTarget) {
          const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$5, relatedTarget);
          if (hideEvent.defaultPrevented) {
            return;
          }
    
          // If this is a touch-enabled device we remove the extra
          // empty mouseover listeners we added for iOS support
          if ('ontouchstart' in document.documentElement) {
            for (const element of [].concat(...document.body.children)) {
              EventHandler.off(element, 'mouseover', noop);
            }
          }
          if (this._popper) {
            this._popper.destroy();
          }
          this._menu.classList.remove(CLASS_NAME_SHOW$6);
          this._element.classList.remove(CLASS_NAME_SHOW$6);
          this._element.setAttribute('aria-expanded', 'false');
          Manipulator.removeDataAttribute(this._menu, 'popper');
          EventHandler.trigger(this._element, EVENT_HIDDEN$5, relatedTarget);
        }
        _getConfig(config) {
          config = super._getConfig(config);
          if (typeof config.reference === 'object' && !isElement$1(config.reference) && typeof config.reference.getBoundingClientRect !== 'function') {
            // Popper virtual elements require a getBoundingClientRect method
            throw new TypeError(`${NAME$a.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
          }
          return config;
        }
        _createPopper() {
          if (typeof Popper === 'undefined') {
            throw new TypeError('Bootstrap\'s dropdowns require Popper (https://popper.js.org)');
          }
          let referenceElement = this._element;
          if (this._config.reference === 'parent') {
            referenceElement = this._parent;
          } else if (isElement$1(this._config.reference)) {
            referenceElement = getElement(this._config.reference);
          } else if (typeof this._config.reference === 'object') {
            referenceElement = this._config.reference;
          }
          const popperConfig = this._getPopperConfig();
          this._popper = createPopper(referenceElement, this._menu, popperConfig);
        }
        _isShown() {
          return this._menu.classList.contains(CLASS_NAME_SHOW$6);
        }
        _getPlacement() {
          const parentDropdown = this._parent;
          if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
            return PLACEMENT_RIGHT;
          }
          if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
            return PLACEMENT_LEFT;
          }
          if (parentDropdown.classList.contains(CLASS_NAME_DROPUP_CENTER)) {
            return PLACEMENT_TOPCENTER;
          }
          if (parentDropdown.classList.contains(CLASS_NAME_DROPDOWN_CENTER)) {
            return PLACEMENT_BOTTOMCENTER;
          }
    
          // We need to trim the value because custom properties can also include spaces
          const isEnd = getComputedStyle(this._menu).getPropertyValue('--bs-position').trim() === 'end';
          if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
            return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
          }
          return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
        }
        _detectNavbar() {
          return this._element.closest(SELECTOR_NAVBAR) !== null;
        }
        _getOffset() {
          const {
            offset
          } = this._config;
          if (typeof offset === 'string') {
            return offset.split(',').map(value => Number.parseInt(value, 10));
          }
          if (typeof offset === 'function') {
            return popperData => offset(popperData, this._element);
          }
          return offset;
        }
        _getPopperConfig() {
          const defaultBsPopperConfig = {
            placement: this._getPlacement(),
            modifiers: [{
              name: 'preventOverflow',
              options: {
                boundary: this._config.boundary
              }
            }, {
              name: 'offset',
              options: {
                offset: this._getOffset()
              }
            }]
          };
    
          // Disable Popper if we have a static display or Dropdown is in Navbar
          if (this._inNavbar || this._config.display === 'static') {
            Manipulator.setDataAttribute(this._menu, 'popper', 'static'); // TODO: v6 remove
            defaultBsPopperConfig.modifiers = [{
              name: 'applyStyles',
              enabled: false
            }];
          }
          return {
            ...defaultBsPopperConfig,
            ...execute(this._config.popperConfig, [defaultBsPopperConfig])
          };
        }
        _selectMenuItem({
          key,
          target
        }) {
          const items = SelectorEngine.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter(element => isVisible(element));
          if (!items.length) {
            return;
          }
    
          // if target isn't included in items (e.g. when expanding the dropdown)
          // allow cycling to get the last item in case key equals ARROW_UP_KEY
          getNextActiveElement(items, target, key === ARROW_DOWN_KEY$1, !items.includes(target)).focus();
        }
    
        // Static
        static jQueryInterface(config) {
          return this.each(function () {
            const data = Dropdown.getOrCreateInstance(this, config);
            if (typeof config !== 'string') {
              return;
            }
            if (typeof data[config] === 'undefined') {
              throw new TypeError(`No method named "${config}"`);
            }
            data[config]();
          });
        }
        static clearMenus(event) {
          if (event.button === RIGHT_MOUSE_BUTTON || event.type === 'keyup' && event.key !== TAB_KEY$1) {
            return;
          }
          const openToggles = SelectorEngine.find(SELECTOR_DATA_TOGGLE_SHOWN);
          for (const toggle of openToggles) {
            const context = Dropdown.getInstance(toggle);
            if (!context || context._config.autoClose === false) {
              continue;
            }
            const composedPath = event.composedPath();
            const isMenuTarget = composedPath.includes(context._menu);
            if (composedPath.includes(context._element) || context._config.autoClose === 'inside' && !isMenuTarget || context._config.autoClose === 'outside' && isMenuTarget) {
              continue;
            }
    
            // Tab navigation through the dropdown menu or events from contained inputs shouldn't close the menu
            if (context._menu.contains(event.target) && (event.type === 'keyup' && event.key === TAB_KEY$1 || /input|select|option|textarea|form/i.test(event.target.tagName))) {
              continue;
            }
            const relatedTarget = {
              relatedTarget: context._element
            };
            if (event.type === 'click') {
              relatedTarget.clickEvent = event;
            }
            context._completeHide(relatedTarget);
          }
        }
        static dataApiKeydownHandler(event) {
          // If not an UP | DOWN | ESCAPE key => not a dropdown command
          // If input/textarea && if key is other than ESCAPE => not a dropdown command
    
          const isInput = /input|textarea/i.test(event.target.tagName);
          const isEscapeEvent = event.key === ESCAPE_KEY$2;
          const isUpOrDownEvent = [ARROW_UP_KEY$1, ARROW_DOWN_KEY$1].includes(event.key);
          if (!isUpOrDownEvent && !isEscapeEvent) {
            return;
          }
          if (isInput && !isEscapeEvent) {
            return;
          }
          event.preventDefault();
    
          // TODO: v6 revert #37011 & change markup https://getbootstrap.com/docs/5.3/forms/input-group/
          const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE$3) ? this : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.next(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.findOne(SELECTOR_DATA_TOGGLE$3, event.delegateTarget.parentNode);
          const instance = Dropdown.getOrCreateInstance(getToggleButton);
          if (isUpOrDownEvent) {
            event.stopPropagation();
            instance.show();
            instance._selectMenuItem(event);
            return;
          }
          if (instance._isShown()) {
            // else is escape and we check if it is shown
            event.stopPropagation();
            instance.hide();
            getToggleButton.focus();
          }
        }
      }
    
      /**
       * Data API implementation
       */
    
      EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE$3, Dropdown.dataApiKeydownHandler);
      EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
      EventHandler.on(document, EVENT_CLICK_DATA_API$3, Dropdown.clearMenus);
      EventHandler.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
      EventHandler.on(document, EVENT_CLICK_DATA_API$3, SELECTOR_DATA_TOGGLE$3, function (event) {
        event.preventDefault();
        Dropdown.getOrCreateInstance(this).toggle();
      });
    
      /**
       * jQuery
       */
    
      defineJQueryPlugin(Dropdown);
    
      const index_umd = {
        Dropdown,
      };
    
      return index_umd;
    
}
