import d3 from 'd3';
import {totalCollisionArea, areaOfIntersection} from '../util/collision';
import minimum from '../util/minimum';
import {getAllPlacements} from '../util/placement';

export default function() {

    var bounds = [0, 0];

    var strategy = function(data) {
        var rectangles = [];

        data.forEach(function(rectangle) {
            // add this rectangle - in all its possible placements
            var candidateConfigurations = getAllPlacements(rectangle)
                .map(function(placement) {
                    var copy = rectangles.slice();
                    copy.push(placement);
                    return copy;
                });

            // keep the one the minimises the 'score'
            rectangles = minimum(candidateConfigurations, scorer)[1];
        });

        return rectangles;
    };

    function scorer(layout) {
        var areaOfCollisions = totalCollisionArea(layout);

        var areaOutsideContainer = 0;
        if (bounds[0] !== 0 && bounds[1] !== 0) {
            var containerRect = {
                x: 0, y: 0, width: bounds[0], height: bounds[1]
            };
            areaOutsideContainer = d3.sum(layout.map(function(d) {
                var areaOutside = d.width * d.height - areaOfIntersection(d, containerRect);
                // this bias is twice as strong as the overlap penalty
                return areaOutside * 2;
            }));
        }

        return areaOfCollisions + areaOutsideContainer;
    }

    strategy.bounds = function(x) {
        if (!arguments.length) {
            return bounds;
        }
        bounds = x;
        return strategy;
    };

    return strategy;
}
