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
   * Chartist plugin that adds a hover event to each point, slice or bar on your chart.
   * @author Pier-Luc Gendreau
   * @version 1.0 14 May 2018
   */
  (function(window, document, Chartist) {
    "use strict";

    var publicOptions = {
      onMouseEnter: () => null,
      onMouseLeave: () => null,
      triggerSelector: null
    };

    Chartist.plugins = Chartist.plugins || {};

    Chartist.plugins.hover = function(options) {
      options = Chartist.extend({}, publicOptions, options);

      /**
       * Chartist hover plugin
       * @param Chart chart
       */
      return function hover(chart) {
        var triggerSelector = getTriggerSelector();
        var hoverClass = getDefaultTriggerClass() + "--hover";
        var pointValues = getPointValues();
        var hoveredElement = null;

        init();

        /**
         * Initialize the hover events
         */
        function init() {
          if (!chart.container) {
            return;
          }

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

                hoveredElement = null;

                options.onMouseLeave(pointElement);
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

          if (hoveredElement === pointElement) {
            return;
          }

          if (hoveredElement) {
            options.onMouseLeave(hoveredElement);
          }

          hoveredElement = pointElement;

          const seriesName = pointElement.parentNode.getAttribute(
            "ct:series-name"
          );

          const seriesGroups = Array.prototype.slice.call(
            pointElement.parentNode.parentNode.children
          );

          const seriesIndex = options.dataDrawnReversed
            ? seriesGroups.reverse().indexOf(pointElement.parentNode)
            : seriesGroups.indexOf(pointElement.parentNode);

          const valueGroup = Array.prototype.slice.call(
            pointElement.parentNode.querySelectorAll(
              "." + getDefaultTriggerClass()
            )
          );

          const valueIndex = valueGroup.indexOf(pointElement);

          // clone the series array
          let seriesData = chart.data.series.slice(0);

          seriesData = chart.options.reverseData
            ? seriesData.reverse()[seriesIndex]
            : seriesData[seriesIndex];

          seriesData =
            !Array.isArray(seriesData) &&
            typeof seriesData == "object" &&
            seriesData.data
              ? seriesData.data
              : seriesData;

          if (!seriesData) {
            return;
          }

          const itemData =
            !Array.isArray(seriesData) && typeof seriesData == "object"
              ? seriesData
              : seriesData[valueIndex];

          if (itemData == null) {
            return;
          }

          options.onMouseEnter(
            Object.assign({}, e, {
              target: pointElement
            }),
            itemData.hasOwnProperty("value")
              ? {
                  meta: itemData.meta,
                  value: itemData.value
                }
              : itemData
          );
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
