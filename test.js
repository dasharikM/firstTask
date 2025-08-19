document.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById('element');
    const colors= ['color-r', 'color-b', 'color-y', 'color-g'];

    function getRandomNumber(min,max){
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    console.log(element.textContent)
    const controller = new inputController({
        left: { keys: [37, 65], enabled: true },
        right: { keys: [39, 68], enabled: true }
    }, element);

    element.addEventListener(inputController.ACTION_ACTIVATED, (e) => {
        console.log('Activated:', e.detail.act);
        if (e.detail.act === 'right'){
            let position = element.style.transform.slice(11,-3);
            element.style.transform = 'translateX('+ (parseInt(position) + 10) + 'px)';
        }
        else if( e.detail.act === 'left'){
            let position = element.style.transform.slice(11,-3);
            element.style.transform = 'translateX('+ (parseInt(position) - 10) + 'px)';
        }
       /*  else if(e.detail.act === 'space'){
            element.className = 'element ';
            element.className += colors[getRandomNumber(0,colors.length-1)];
        } */
    });

    element.addEventListener(inputController.ACTION_DEACTIVATED, (e) => {
        console.log('Deactivated:', e.detail.act);
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

    document.getElementById('activation').addEventListener('click', ()=>{
            controller.enabled = true;
        document.getElementById('status').textContent = 'activated';
    });

    document.getElementById('deactivation').addEventListener('click', ()=>{
      
            controller.enabled = false;
        document.getElementById('status').textContent = 'deactivated';
    });

    let el = document.getElementById('plusActivity');
    el.addEventListener('click', ()=>{
        controller.addActivity({
        space: { keys: [32], enabled: true }});
        document.getElementById('status').textContent = '+ " space"';
    })

    /* // Проверка активности
    setInterval(() => {
        console.log('left:', controller.isActionActive('left'));
        console.log('right:', controller.isActionActive('right'));
    }, 500); */
});
