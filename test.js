<<<<<<< HEAD
=======
// input-controller-test.js
>>>>>>> 195c3af8b818c6b1515d94bc1e86070414a5a0ee

document.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById('element');
    const controller = new InputController({
        left: { keys: [37, 65], enabled: true },
        right: { keys: [39, 68], enabled: true }
    }, element);

<<<<<<< HEAD
=======
    // Подключаем мышь
>>>>>>> 195c3af8b818c6b1515d94bc1e86070414a5a0ee
    document.getElementById('mouse').addEventListener('click', () => {
        controller.use(MousePlugin);
        document.getElementById('pluginMouse').textContent = 'мышь ВКЛ';
    });

    document.getElementById('mouseOff').addEventListener('click', () => {
        controller.remove(MousePlugin);
        document.getElementById('pluginMouse').textContent = 'мышь ВЫКЛ';
    });

<<<<<<< HEAD
=======
    // Обработчики событий
>>>>>>> 195c3af8b818c6b1515d94bc1e86070414a5a0ee
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

<<<<<<< HEAD
=======
    // Другие кнопки управления
>>>>>>> 195c3af8b818c6b1515d94bc1e86070414a5a0ee
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
            space: { keys: [32], enabled: true }
        });
<<<<<<< HEAD

=======
>>>>>>> 195c3af8b818c6b1515d94bc1e86070414a5a0ee
        document.getElementById('status').textContent = '+ "space"';
    });
});