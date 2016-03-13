export { default as labelLayout } from './src/label';

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
