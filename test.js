
document.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById('element');
    const controller = new InputController({
        left: { keys: [37, 65], mouseButtons: [0], enabled: true },
        right: { keys: [39, 68], mouseButtons: [2], enabled: true }
    }, element);

    document.getElementById('mouse').addEventListener('click', () => {
        controller.use(MousePlugin);
        document.getElementById('pluginMouse').textContent = 'мышь ВКЛ';
    });

    document.getElementById('mouseOff').addEventListener('click', () => {
        controller.remove(MousePlugin);
        document.getElementById('pluginMouse').textContent = 'мышь ВЫКЛ';
    });

    element.addEventListener(InputController.ACTION_ACTIVATED, (e) => {
        console.log('Activated:', e.detail.act);
        if (e.detail.act === 'right'){
            let position = element.style.transform.slice(11,-3);
            element.style.transform = 'translateX('+ (parseInt(position) + 10) + 'px)';
        }
        else if( e.detail.act === 'left'){
            let position = element.style.transform.slice(11,-3);
            element.style.transform = 'translateX('+ (parseInt(position) - 10) + 'px)';
        }
    });

    element.addEventListener(InputController.ACTION_DEACTIVATED, (e) => {
        console.log('Deactivated:', e.detail.act);
        if (e.detail.act === 'space') {
            element.classList.remove('color-g');
        }
    });

    document.getElementById('attach').addEventListener('click', () => {
        if (!controller.enabled)
            controller.attach(element, true);
        else controller.attach(element);
        document.getElementById('status').textContent = 'attached';
    });

    document.getElementById('detach').addEventListener('click', () => {
        controller.detach();
        document.getElementById('status').textContent = 'detached';
    });

    document.getElementById('activation').addEventListener('click', () => {
        controller.enabled = true;
        document.getElementById('status').textContent = 'activated';
    });

    document.getElementById('deactivation').addEventListener('click', () => {
        controller.enabled = false;
        document.getElementById('status').textContent = 'deactivated';
    });

    document.getElementById('plusActivity').addEventListener('click', () => {
        controller.bindActions({
            space: { keys: [32], mouseButtons: [], enabled: true }
        });
        document.getElementById('status').textContent = '+ "space"';
    });
});