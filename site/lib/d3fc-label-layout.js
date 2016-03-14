(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3')) :
    typeof define === 'function' && define.amd ? define(['exports', 'd3'], factory) :
    (factory((global.fc = global.fc || {}, global.fc.layout = global.fc.layout || {}),global.d3));
}(this, function (exports,d3) { 'use strict';

    d3 = 'default' in d3 ? d3['default'] : d3;

    var babelHelpers = {};
    babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
    };
    babelHelpers;

    function identity(d) {
        return d;
    }

    function index(d, i) {
        return i;
    }

    function noop(d) {}

    // "Caution: avoid interpolating to or from the number zero when the interpolator is used to generate
    // a string (such as with attr).
    // Very small values, when stringified, may be converted to scientific notation and
    // cause a temporarily invalid attribute or style property value.
    // For example, the number 0.0000001 is converted to the string "1e-7".
    // This is particularly noticeable when interpolating opacity values.
    // To avoid scientific notation, start or end the transition at 1e-6,
    // which is the smallest value that is not stringified in exponential notation."
    // - https://github.com/mbostock/d3/wiki/Transitions#d3_interpolateNumber
    var effectivelyZero = 1e-6;

    // Wrapper around d3's selectAll/data data-join, which allows decoration of the result.
    // This is achieved by appending the element to the enter selection before exposing it.
    // A default transition of fade in/out is also implicitly added but can be modified.

    function dataJoinUtil () {
        var selector = 'g';
        var children = false;
        var element = 'g';
        var attr = {};
        var key = index;

        var dataJoin = function dataJoin(container, data) {

            var joinedData = data || identity;

            // Can't use instanceof d3.selection (see #458)
            if (!(container.selectAll && container.node)) {
                container = d3.select(container);
            }

            // update
            var selection = container.selectAll(selector);
            if (children) {
                // in order to support nested selections, they can be filtered
                // to only return immediate children of the container
                selection = selection.filter(function () {
                    return this.parentNode === container.node();
                });
            }
            var updateSelection = selection.data(joinedData, key);

            // enter
            // when container is a transition, entering elements fade in (from transparent to opaque)
            // N.B. insert() is used to create new elements, rather than append(). insert() behaves in a special manner
            // on enter selections - entering elements will be inserted immediately before the next following sibling
            // in the update selection, if any.
            // This helps order the elements in an order consistent with the data, but doesn't guarantee the ordering;
            // if the updating elements change order then selection.order() would be required to update the order.
            // (#528)
            var enterSelection = updateSelection.enter().insert(element) // <<<--- this is the secret sauce of this whole file
            .attr(attr).style('opacity', effectivelyZero);

            // exit
            // when container is a transition, exiting elements fade out (from opaque to transparent)
            var exitSelection = d3.transition(updateSelection.exit()).style('opacity', effectivelyZero).remove();

            // when container is a transition, all properties of the transition (which can be interpolated)
            // will transition
            updateSelection = d3.transition(updateSelection).style('opacity', 1);

            updateSelection.enter = d3.functor(enterSelection);
            updateSelection.exit = d3.functor(exitSelection);
            return updateSelection;
        };

        dataJoin.selector = function (x) {
            if (!arguments.length) {
                return selector;
            }
            selector = x;
            return dataJoin;
        };
        dataJoin.children = function (x) {
            if (!arguments.length) {
                return children;
            }
            children = x;
            return dataJoin;
        };
        dataJoin.element = function (x) {
            if (!arguments.length) {
                return element;
            }
            element = x;
            return dataJoin;
        };
        dataJoin.attr = function (x) {
            if (!arguments.length) {
                return attr;
            }

            if (arguments.length === 1) {
                attr = arguments[0];
            } else if (arguments.length === 2) {
                var dataKey = arguments[0];
                var value = arguments[1];

                attr[dataKey] = value;
            }

            return dataJoin;
        };
        dataJoin.key = function (x) {
            if (!arguments.length) {
                return key;
            }
            key = x;
            return dataJoin;
        };

        return dataJoin;
    }

    /**
     * An overload of the d3.rebind method which allows the source methods
     * to be rebound to the target with a different name. In the mappings object
     * keys represent the target method names and values represent the source
     * object names.
     */
    function rebind(target, source, mappings) {
        if ((typeof mappings === 'undefined' ? 'undefined' : babelHelpers.typeof(mappings)) !== 'object') {
            return d3.rebind.apply(d3, arguments);
        }
        Object.keys(mappings).forEach(function (targetName) {
            var method = source[mappings[targetName]];
            if (typeof method !== 'function') {
                throw new Error('The method ' + mappings[targetName] + ' does not exist on the source object');
            }
            target[targetName] = function () {
                var value = method.apply(source, arguments);
                return value === source ? target : value;
            };
        });
        return target;
    }

    function capitalizeFirstLetter(str) {
        return str[0].toUpperCase() + str.slice(1);
    }

    /**
     * Rebinds all the methods from the source component, adding the given prefix. An
     * optional exclusions parameter can be used to specify methods which should not
     * be rebound.
     */
    function rebindAll(target, source, prefix, exclusions) {
        prefix = typeof prefix !== 'undefined' ? prefix : '';

        // if exclusions isn't an array, construct it
        if (!(arguments.length === 4 && Array.isArray(exclusions))) {
            exclusions = Array.prototype.slice.call(arguments, 3);
        }

        exclusions = exclusions.map(function (exclusion) {
            if (typeof exclusion === 'string') {
                if (!source.hasOwnProperty(exclusion)) {
                    throw new Error('The method ' + exclusion + ' does not exist on the source object');
                }
                exclusion = new RegExp('^' + exclusion + '$');
            }
            return exclusion;
        });

        function exclude(testedProperty) {
            return exclusions.some(function (exclusion) {
                return testedProperty.match(exclusion);
            });
        }

        function reboundPropertyName(inputProperty) {
            return prefix !== '' ? prefix + capitalizeFirstLetter(inputProperty) : inputProperty;
        }

        var bindings = {};
        for (var property in source) {
            if (source.hasOwnProperty(property) && !exclude(property)) {
                bindings[reboundPropertyName(property)] = property;
            }
        }

        rebind(target, source, bindings);
    }

    function label (layoutStrategy) {

        var size = d3.functor([0, 0]);
        var position = function position(d, i) {
            return [d.x, d.y];
        };
        var strategy = layoutStrategy || identity;
        var component = noop;

        var dataJoin = dataJoinUtil().selector('g.label').element('g').attr('class', 'label');

        var label = function label(selection) {

            selection.each(function (data, index) {

                var g = dataJoin(this, data).call(component);

                // obtain the rectangular bounding boxes for each child
                var childRects = g[0].map(function (node, i) {
                    var d = d3.select(node).datum();
                    var childPos = position.call(node, d, i);
                    var childSize = size.call(node, d, i);
                    return {
                        hidden: false,
                        x: childPos[0],
                        y: childPos[1],
                        width: childSize[0],
                        height: childSize[1]
                    };
                });

                // apply the strategy to derive the layout. The strategy does not change the order
                // or number of label.
                var layout = strategy(childRects);

                g.attr({
                    'display': function display(d, i) {
                        return layout[i].hidden ? 'none' : 'inherit';
                    },
                    'transform': function transform(d, i) {
                        return 'translate(' + layout[i].x + ', ' + layout[i].y + ')';
                    },
                    // set the layout width / height so that children can use SVG layout if required
                    'layout-width': function layoutWidth(d, i) {
                        return layout[i].width;
                    },
                    'layout-height': function layoutHeight(d, i) {
                        return layout[i].height;
                    }
                });

                g.call(component);
            });
        };

        rebind(label, dataJoin, 'key');
        rebindAll(label, strategy);

        label.size = function (x) {
            if (!arguments.length) {
                return size;
            }
            size = d3.functor(x);
            return label;
        };

        label.position = function (x) {
            if (!arguments.length) {
                return position;
            }
            position = d3.functor(x);
            return label;
        };

        label.component = function (value) {
            if (!arguments.length) {
                return component;
            }
            component = value;
            return label;
        };

        return label;
    }

    // searches for a minimum when applying the given accessor to each item within the supplied array.
    // The returned array has the following form:
    // [minumum accessor value, datum, index]
    function minimum(data, accessor) {
        return data.map(function (dataPoint, index) {
            return [accessor(dataPoint, index), dataPoint, index];
        }).reduce(function (accumulator, dataPoint) {
            return accumulator[0] > dataPoint[0] ? dataPoint : accumulator;
        }, [Number.MAX_VALUE, null, -1]);
    }

    function isIntersecting(a, b) {
        return !(a.x >= b.x + b.width || a.x + a.width <= b.x || a.y >= b.y + b.height || a.y + a.height <= b.y);
    }

    function areaOfIntersection(a, b) {
        var left = Math.max(a.x, b.x);
        var right = Math.min(a.x + a.width, b.x + b.width);
        var top = Math.max(a.y, b.y);
        var bottom = Math.min(a.y + a.height, b.y + b.height);
        return (right - left) * (bottom - top);
    }

    function collidingWith(rectangles, index) {
        var rectangle = rectangles[index];

        // Filter all rectangles that aren't the selected rectangle
        // and the filter if they intersect.
        return rectangles.filter(function (_, i) {
            return index !== i;
        }).filter(function (d) {
            return isIntersecting(d, rectangle);
        });
    }

    function collisionArea(rectangles, index) {
        var rectangle = rectangles[index];
        var collisions = collidingWith(rectangles, index);

        return d3.sum(collisions.map(function (d) {
            return areaOfIntersection(rectangle, d);
        }));
    }

    function totalCollisionArea(rectangles) {
        return d3.sum(rectangles.map(function (_, i) {
            return collisionArea(rectangles, i);
        }));
    }

    // the container component is used to determine whether a points
    // is within the a bounding container. This component is typically
    // used by other strategies.
    function containerUtils () {
        var bounds = [null, null];

        var container = function container(point) {
            var width = bounds[0];
            var height = bounds[1];
            // If the bounds haven't been defined, then don't enforce
            return width == null && height == null || !(point.x < 0 || point.y < 0 || point.x > width || point.y > height || point.x + point.width > width || point.y + point.height > height);
        };

        container.area = function () {
            return bounds[0] * bounds[1];
        };

        container.bounds = function (value) {
            if (!arguments.length) {
                return bounds;
            }
            bounds = value;
            return container;
        };

        return container;
    }

    function getAllPlacements(label) {
        var x = label.x;
        var y = label.y;
        var width = label.width;
        var height = label.height;
        return [getPlacement(x, y, width, height), // Same location
        getPlacement(x - width, y, width, height), // Left
        getPlacement(x - width, y - height, width, height), // Up, left
        getPlacement(x, y - height, width, height), // Up
        getPlacement(x, y - height / 2, width, height), // Half up
        getPlacement(x - width / 2, y, width, height), // Half left
        getPlacement(x - width, y - height / 2, width, height), // Full left, half up
        getPlacement(x - width / 2, y - height, width, height) // Full up, half left
        ];
    }

    function getPlacement(x, y, width, height) {
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }

    function randomItem(array) {
        return array[randomIndex(array)];
    }

    function randomIndex(array) {
        return Math.floor(Math.random() * array.length);
    }

    function cloneAndReplace(array, index, replacement) {
        var clone = array.slice();
        clone[index] = replacement;
        return clone;
    }

    function local () {

        var container = containerUtils();
        var iterations = 1;

        var strategy = function strategy(data) {

            var originalData = data;
            var iteratedData = data;

            var thisIterationScore = Number.MAX_VALUE;
            var lastIterationScore = Infinity;
            var iteration = 0;

            // Keep going until there's no more iterations to do or
            // the solution is a local minimum
            while (iteration < iterations && thisIterationScore < lastIterationScore) {
                lastIterationScore = thisIterationScore;

                iteratedData = iterate(originalData, iteratedData);

                thisIterationScore = totalCollisionArea(iteratedData);
                iteration++;
            }
            return iteratedData;
        };

        strategy.iterations = function (i) {
            if (!arguments.length) {
                return iterations;
            }

            iterations = i;
            return strategy;
        };

        function iterate(originalData, iteratedData) {

            // Find rectangles with collisions or are outside of the bounds of the container
            iteratedData.map(function (d, i) {
                return [d, i];
            }).filter(function (d, i) {
                return collidingWith(iteratedData, d[1]).length || !container(d[0]);
            }).forEach(function (d) {

                // Use original data to stop wandering rectangles with each iteration
                var placements = getAllPlacements(originalData[d[1]]);

                // Create different states the algorithm could transition to
                var candidateReplacements = placements.map(function (placement) {
                    return cloneAndReplace(iteratedData, d[1], placement);
                });

                // Choose the best state.
                var bestPlacement = minimum(candidateReplacements, function (placement) {
                    var areaOfCollisions = collisionArea(placement, d[1]);
                    var isOnScreen = container(placement[d[1]]);
                    return areaOfCollisions + (isOnScreen ? 0 : container.area());
                })[1];

                iteratedData = bestPlacement;
            });
            return iteratedData;
        }

        d3.rebind(strategy, container, 'bounds');

        return strategy;
    }

    function greedy () {

        var container = containerUtils();

        var strategy = function strategy(data) {
            var rectangles = [];

            data.forEach(function (rectangle) {
                // add this rectangle - in all its possible placements
                var candidateConfigurations = getAllPlacements(rectangle).map(function (placement) {
                    var copy = rectangles.slice();
                    copy.push(placement);
                    return copy;
                });

                // keep the one the minimises the 'score'
                rectangles = minimum(candidateConfigurations, scorer)[1];
            });

            return rectangles;
        };

        d3.rebind(strategy, container, 'bounds');

        function scorer(placement) {
            var areaOfCollisions = totalCollisionArea(placement);
            var isOnScreen = true;
            for (var i = 0; i < placement.length && isOnScreen; i++) {
                var point = placement[i];
                isOnScreen = container(point);
            }
            return areaOfCollisions + (isOnScreen ? 0 : container.area());
        }

        return strategy;
    }

    function annealing () {

        var container = containerUtils();
        var temperature = 1000;
        var cooling = 10;

        var strategy = function strategy(data) {

            var originalData = data;
            var iteratedData = data;

            var lastScore = Infinity;
            var currentTemperature = temperature;
            while (currentTemperature > 0) {

                var potentialReplacement = getPotentialState(originalData, iteratedData);

                var potentialScore = scorer(potentialReplacement);

                // Accept the state if it's a better state
                // or at random based off of the difference between scores.
                // This random % helps the algorithm break out of local minima
                var probablityOfChoosing = Math.exp((lastScore - potentialScore) / currentTemperature);
                if (potentialScore < lastScore || probablityOfChoosing > Math.random()) {
                    iteratedData = potentialReplacement;
                    lastScore = potentialScore;
                }

                currentTemperature -= cooling;
            }
            return iteratedData;
        };

        strategy.temperature = function (i) {
            if (!arguments.length) {
                return temperature;
            }

            temperature = i;
            return strategy;
        };

        strategy.cooling = function (i) {
            if (!arguments.length) {
                return cooling;
            }

            cooling = i;
            return strategy;
        };

        function getPotentialState(originalData, iteratedData) {
            // For one point choose a random other placement.

            var victimLabelIndex = randomIndex(originalData);
            var label = originalData[victimLabelIndex];

            var replacements = getAllPlacements(label);
            var replacement = randomItem(replacements);

            return cloneAndReplace(iteratedData, victimLabelIndex, replacement);
        }

        d3.rebind(strategy, container, 'bounds');

        function scorer(placement) {
            var collisionArea = totalCollisionArea(placement);
            var pointsOnScreen = 1;
            for (var i = 0; i < placement.length; i++) {
                var point = placement[i];
                pointsOnScreen += container(point) ? 0 : 100;
            }
            return collisionArea * pointsOnScreen;
        }

        return strategy;
    }

    // iteratively remove the rectangle with the greatest area of collision
    function removeOverlaps (adaptedStrategy) {

        adaptedStrategy = adaptedStrategy || identity;

        var removeOverlaps = function removeOverlaps(layout) {

            layout = adaptedStrategy(layout);

            // returns a function that computes the area of overlap for rectangles
            // in the given layout array
            function scorerForLayout(l) {
                return function scorer(d, i) {
                    return -collisionArea(l, i);
                };
            }

            var iterate = true;
            do {
                // apply the overlap calculation to visible rectangles
                var filteredLayout = layout.filter(function (d) {
                    return !d.hidden;
                });
                var min = minimum(filteredLayout, scorerForLayout(filteredLayout));
                if (min[0] < 0) {
                    // hide the rectangle with the greatest collision area
                    min[1].hidden = true;
                } else {
                    iterate = false;
                }
            } while (iterate);

            return layout;
        };

        rebindAll(removeOverlaps, adaptedStrategy);

        return removeOverlaps;
    }

    var strategy = {
        local: local,
        greedy: greedy,
        annealing: annealing,
        removeOverlaps: removeOverlaps
    };

    exports.strategy = strategy;
    exports.label = label;

}));