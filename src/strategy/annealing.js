import d3 from 'd3';
import {totalCollisionArea, areaOfIntersection} from '../util/collision';
import containerUtils from './container';
import {getAllPlacements} from '../util/placement';
import {randomItem, randomIndex, cloneAndReplace} from '../util/array';

export default function() {

    var container = containerUtils();
    var temperature = 1000;
    var cooling = 1;
    var bounds = [0, 0];

    var strategy = function(data) {

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

    strategy.temperature = function(i) {
        if (!arguments.length) {
            return temperature;
        }

        temperature = i;
        return strategy;
    };

    strategy.cooling = function(i) {
        if (!arguments.length) {
            return cooling;
        }

        cooling = i;
        return strategy;
    };

    strategy.bounds = function(x) {
        if (!arguments.length) {
            return bounds;
        }
        bounds = x;
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

    function scorer(layout) {
        // penalise collisions
        var collisionArea = totalCollisionArea(layout);

        // penalise rectangles falling outside of the bounds
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

        // pernalise certain orientations
        var orientationBias = d3.sum(layout.map(function(d) {
            // this bias is not as strong as overlap penalty
            var area = d.width * d.height / 2;
            if (d.location === 'bottom-right') {
                area = 0;
            }
            if (d.location === 'middle-right' || d.location === 'bottom-center') {
                area = area / 2;
            }
            return area;
        }));

        return collisionArea + areaOutsideContainer + orientationBias;
    }

    return strategy;
}
