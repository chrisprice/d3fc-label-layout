import d3 from 'd3';
import dataJoinUtil from './util/dataJoin';
import {noop, identity} from './util/fn';
import {rebindAll, rebind} from './util/rebind';

export default function(layoutStrategy) {

    var size = d3.functor([0, 0]);
    var position = function(d, i) { return [d.x, d.y]; };
    var strategy = layoutStrategy || identity;
    var component = noop;

    var dataJoin = dataJoinUtil()
        .selector('g.label')
        .element('g')
        .attr('class', 'label');

    var label = function(selection) {

        selection.each(function(data, index) {

            var g = dataJoin(this, data)
                .call(component);

            // obtain the rectangular bounding boxes for each child
            var childRects = g[0].map(function(node, i) {
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
                'display': function(d, i) {
                    return layout[i].hidden ? 'none' : 'inherit';
                },
                'transform': function(d, i) {
                    return 'translate(' + layout[i].x + ', ' + layout[i].y + ')';
                },
                // set the layout width / height so that children can use SVG layout if required
                'layout-width': function(d, i) { return layout[i].width; },
                'layout-height': function(d, i) { return layout[i].height; }
            });

            g.call(component);
        });
    };

    rebind(label, dataJoin, 'key');
    rebindAll(label, strategy);

    label.size = function(x) {
        if (!arguments.length) {
            return size;
        }
        size = d3.functor(x);
        return label;
    };

    label.position = function(x) {
        if (!arguments.length) {
            return position;
        }
        position = d3.functor(x);
        return label;
    };

    label.component = function(value) {
        if (!arguments.length) {
            return component;
        }
        component = value;
        return label;
    };

    return label;
}
