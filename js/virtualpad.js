/*
 * Developed by Shizuoka University xR Association "Hamaria"
 */

const domPad = document.querySelector('.virtualpad');
const domControl = document.querySelector('.virtualpad-control');
let vector = {x:0,y:0};
var VirtualPad = {

    init: function() {
        const initx = 5;
        const inity = 5;
        let updateEvent = new Event('virtualpadmove', {vector:{}});
        //console.log('aaa' + initx + "," + inity);

        let sx, sy = 0;
        domPad.addEventListener('touchstart', (evt) => {
            sx = evt.changedTouches[0].screenX || 0;
            sy = evt.changedTouches[0].screenY || 0;
        }, false);

        domPad.addEventListener('touchmove', (evt) => {
            const cx = evt.changedTouches[0].screenX || 0;
            const cy = evt.changedTouches[0].screenY || 0;
            let vx = cx - sx;
            let vy = cy - sy;
            const sqrt = Math.sqrt(vx*vx+vy*vy);
            vx /= sqrt;
            vy /= sqrt;
            domControl.style.top = (inity + 0 + vy * 20) + 'px';
            domControl.style.left = (initx + 0 + vx * 20) + 'px';
            vector = {x:vx, y:vy};
        }, false);

        domPad.addEventListener('touchend', (evt) => {
            sx = 0;
            sy = 0;
            domControl.style.top = inity + 'px';
            domControl.style.left = initx + 'px';
            vector = {x:0, y:0};

        }, false);
    },
    show: function() {
        domPad.style.display = 'block';
    },
    hide: function() {
        domPad.style.display = 'none';
    },
    getVector: function() {
        return vector;
    }

};

export { VirtualPad };