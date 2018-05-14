(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["chartist"], function(Chartist) {
      return (root.returnExportsGlobal = factory(Chartist));
    });
  } else if (typeof module === "object" && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("chartist"));
  } else {
    // Browser globals (root is window)
    root["Chartist.plugins.hover"] = factory(Chartist);
  }
})(typeof self !== "undefined" ? self : this, function(Chartist) {
  /**
   * Chartist.js plugin to display a tooltip on top of a chart.
   * @author Pier-Luc Gendreau
   * @version 1.0 14 May 2018
   */
  (function(window, document, Chartist) {
    "use strict";

    var startId = 0;

    var publicOptions = {
      onMouseEnter: () => null,
      onMouseLeave: () => null,
      // If you choose to reverse the original order of the chart elements in
      // the DOM, you must set this to true
      dataDrawnReversed: false,
      // only if a custom element is used for the trigger (TODO: test)
      triggerSelector: null,
      id: null
    };

    Chartist.plugins = Chartist.plugins || {};

    Chartist.plugins.hover = function(options) {
      options = Chartist.extend({}, publicOptions, options);

      /**
       * Chartist tooltip plugin
       * @param Chart chart
       */
      return function tooltip(chart) {
        startId++;

        // simple unique id for the tooltip element (needed to be able to
        // add aria-describedby to the trigger while the tooltip is visible)
        options.id = "charttooltip-" + startId;
        var triggerSelector = getTriggerSelector();
        var hoverClass = getDefaultTriggerClass() + "--hover";
        var pointValues = getPointValues();

        init();

        /**
         * Initialize the tooltip
         */
        function init() {
          if (!chart.container) {
            return;
          }

          // set attribute on the container, so external scripts can detect the tooltip element
          chart.container.setAttribute("data-charttooltip-id", options.id);

          // Offer support for multiple series line charts
          if (chart instanceof Chartist.Line) {
            chart.on("created", function() {
              chart.container
                .querySelector("svg")
                .addEventListener("mousemove", prepareLineTooltip);
              chart.container.addEventListener("mouseleave", function(e) {
                var pointElement = chart.container.querySelector(
                  "." + chart.options.classNames.point + "--hover"
                );

                options.onMouseLeave(e);
              });
            });

            return;
          }

          chart.container.addEventListener(
            "mouseover",
            delegate(triggerSelector, options.onMouseEnter)
          );
          chart.container.addEventListener(
            "mouseout",
            delegate(triggerSelector, options.onMouseLeave)
          );
        }

        /**
         * Prepare line tooltip
         * Calculates the closest point on the line according to the current position of the mouse
         * @param Event e
         */
        function prepareLineTooltip(e) {
          var boxData = this.getBoundingClientRect();
          var currentXPosition =
            e.pageX -
            (boxData.left +
              (document.documentElement.scrollLeft ||
                document.body.scrollLeft));
          var currentYPosition =
            e.pageY -
            (boxData.top +
              (document.documentElement.scrollTop || document.body.scrollTop));
          var closestPointOnX = getClosestNumberFromArray(
            currentXPosition,
            pointValues
          );

          var pointElements = chart.container.querySelectorAll(
            "." +
              chart.options.classNames.point +
              '[x1="' +
              closestPointOnX +
              '"]'
          );
          var pointElement;

          if (pointElements.length <= 1) {
            pointElement = pointElements[0];
          } else {
            var yPositions = [];
            var closestPointOnY;

            Array.prototype.forEach.call(pointElements, function(point) {
              yPositions.push(point.getAttribute("y1"));
            });

            closestPointOnY = getClosestNumberFromArray(
              currentYPosition,
              yPositions
            );
            pointElement = chart.container.querySelector(
              "." +
                chart.options.classNames.point +
                '[x1="' +
                closestPointOnX +
                '"][y1="' +
                closestPointOnY +
                '"]'
            );
          }

          if (!pointElement || matches(pointElement, "." + hoverClass)) {
            return;
          }

          options.onMouseEnter(pointElement);
        }

        /**
         * Get trigger selector
         * @return String The selector of the element that should trigger the tooltip
         */
        function getTriggerSelector() {
          if (options.triggerSelector) {
            return options.triggerSelector;
          }

          return "." + getDefaultTriggerClass();
        }

        /**
         * Get default trigger class from the chart instance
         * @return string chart.options.classNames.[specificClassName]
         */
        function getDefaultTriggerClass() {
          if (chart instanceof Chartist.Bar) {
            return chart.options.classNames.bar;
          }
          if (chart instanceof Chartist.Pie) {
            return chart.options.donut
              ? chart.options.classNames.sliceDonut
              : chart.options.classNames.slicePie;
          }

          return chart.options.classNames.point;
        }

        /**
         * Get horizontal point values (only useful for the line type chart)
         * @return Array pointValues The point values
         */
        function getPointValues() {
          var pointValues = [];

          if (!(chart instanceof Chartist.Line)) {
            return;
          }

          chart.on("draw", function(data) {
            if (data.type == "point") {
              pointValues.push(data.x);
            }
          });

          return pointValues;
        }
      };
    };

    /**
     * Delegate event
     * @param string selector
     * @param function listener
     * @returns function
     */
    function delegate(selector, listener) {
      return function(e) {
        var element = e.target;
        do {
          if (!matches(element, selector)) {
            continue;
          }
          e.delegateTarget = element;
          listener.apply(this, arguments);
          return;
        } while ((element = element.parentNode));
      };
    }

    /**
     * Matches selector
     * @param Element el
     * @param string selector
     * @returns bool
     */
    function matches(el, selector) {
      var matchesFunction =
        el.matches ||
        el.webkitMatchesSelector ||
        el.mozMatchesSelector ||
        el.msMatchesSelector;
      if (matchesFunction) {
        return matchesFunction.call(el, selector);
      }
    }

    /**
     * Get the closest number from an array
     * @param Int/Float number
     * @param Array array
     * @return Int The value from the array that is closest to the number
     */
    function getClosestNumberFromArray(number, array) {
      return array.reduce(function(previous, current) {
        return Math.abs(current - number) < Math.abs(previous - number)
          ? current
          : previous;
      });
    }
  })(window, document, Chartist);

  // Just return a value to define the module export.
  return Chartist.plugins.hover;
});
