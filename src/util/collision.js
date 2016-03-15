import d3 from 'd3';
import intersect from '../intersect';

export function collisionArea(rectangles, index) {
    var rectangle = rectangles[index];
    var collisions = rectangles.filter(function(_, i) {
        return index !== i;
    });

    return d3.sum(collisions.map(function(d) {
        return intersect(rectangle, d);
    }));
}

export function totalCollisionArea(rectangles) {
    return d3.sum(rectangles.map(function(_, i) {
        return collisionArea(rectangles, i);
    }));
}
