async function fetchEvents(){
    const response = await fetch('https://www.ufc.com/events');
    var data = await response.json();
    console.log(data);
}