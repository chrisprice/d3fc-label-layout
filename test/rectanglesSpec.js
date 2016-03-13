const d3 = require('d3');
const labelLayout = require('../build/d3fc-label-layout');

describe('fc.layout.rectanges', function() {

    it('should remove collisions', function() {
        var svg = document.createElement('svg');

        var rectangles = labelLayout.labelLayout(labelLayout.strategy.removeOverlaps())
            .size([10, 10])
            .position(function(d) { return [d.x, d.y]; });

        var data = [
            {x: 45, y: 50},
            // this rectangle overlaps both its neighbours, and is the optimum candidate for removal
            // in that once it is removed, neither of the remaining rectangles overlap.
            {x: 50, y: 50},
            {x: 55, y: 50}
        ];

        d3.select(svg)
            .datum(data)
            .call(rectangles);

        expect(svg.children.length).toEqual(3);
        expect(svg.children[0].getAttribute('display')).toEqual('inherit');
        expect(svg.children[1].getAttribute('display')).toEqual('none');
        expect(svg.children[2].getAttribute('display')).toEqual('inherit');
    });

});
