export { default as label } from './src/label';
export { default as textLabel } from './src/textLabel';

import local from './src/strategy/local';
import greedy from './src/strategy/greedy';
import annealing from './src/strategy/annealing';
import removeOverlaps from './src/strategy/removeOverlaps';

export const strategy = {
    local,
    greedy,
    annealing,
    removeOverlaps
};
