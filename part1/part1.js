//Link XML files
if(window.XMLHttpRequest){
    xmlhttp=new XMLHttpRequest();
}
else{
    xmlhttp=new ActiveXObject(Microsoft.XMLHTTP);
}
xmlhttp.open("GET","table.xml",false);
xmlhttp.send();
tableDoc=xmlhttp.responseXML;

xmlhttp.open("GET","menu.xml",false);
xmlhttp.send();
menuDoc=xmlhttp.responseXML;



//Define data class for table
function Table(id, location, capacity, booktime, image, tableStatus) {
    this.id = id; // Starts from 1
    this.location = location;
    this.capacity = capacity;
    this.image = image;
    this.booktime = booktime; // Date[]
    this.tableStatus = tableStatus; // 0 = unavailable, 1 = selected, 2 = available
}

//Instances for each table
var mTables = [];//Array of instances for each table
var t = tableDoc.getElementsByTagName("table");
for (var i = 0; i < t.length; i++) {
    var tid = t[i].getElementsByTagName("id")[0].childNodes[0].nodeValue;
    var tlocation = t[i].getElementsByTagName("location")[0].childNodes[0].nodeValue;
    var tcapacity = t[i].getElementsByTagName("capacity")[0].childNodes[0].nodeValue;
    var timage = t[i].getElementsByTagName("image")[0].childNodes[0].nodeValue;
    mTables[i] = new Table(tid, tlocation, tcapacity, [], timage, 2);
}

//Define mReservationData as a ReservationData object
var mReservationData = new ReservationData(-1, null, 0, 0, 0);
function ReservationData(selectedTable, date, time, people, location) {
    this.selectedTable = selectedTable; // table id from 1
    this.date = date;
    this.time = time; // 1~22 = 10:00 ~ 20:30
    this.people = people;
    this.location = location; // {room1, room2, deck}
}


//Define data class for dish
function Dish(name, image, description, typeindication, cost){
    this.name = name;
    this.image = image;
    this.description = description;
    this.typeindication = typeindication;
    this.cost = cost;
}

//Instances for each dish
var mDishes = [];
var d = menuDoc.getElementsByTagName("dish");
for (var i = 0; i < d.length; i++){
    var dname = d[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
    var dimage = d[i].getElementsByTagName("image")[0].childNodes[0].nodeValue;
    var ddescription = d[i].getElementsByTagName("description")[0].childNodes[0].nodeValue;
    var dtypeindication = d[i].getElementsByTagName("typeIndication")[0].childNodes[0].nodeValue;
    var dcost = d[i].getElementsByTagName("cost")[0].childNodes[0].nodeValue;
    var ddish = new Dish(dname, dimage, ddescription, dtypeindication,dcost);
    mDishes[i] = ddish;
}

//Page onload 
function pageOnload(){
    peopleSelectOption();//Define people select option
    defaultDate();
    defaultTime();
    defaultPeople();
    document.getElementById("locationSelect").selectedIndex = 0;
    showTables();
    showDishes();
    $("document").ready(function(){
        $.getJSON("http://api.openweathermap.org/data/2.5/weather?q=Auckland&units=metric&appid=60d756b6431965cd0192b76fbf91d66c", function(data) {
           console.log(data);
            mWeatherID = data.weather[0].id;
            mTemp = +data.main.temp;
        //    mTemp = Math.round(+data.main.temp);
        //    mTemp = parseFloat(Math.round((+data.main.temp - 273.15) * 100) / 100).toFixed(0);
            $("#temp").text(mTemp + "℃");
            $("#weatherDescription").text(data.weather[0].main);
            $("#pic").html("<img src=\"http://openweathermap.org/img/w/"+data.weather[0].icon+".png\">");
     });
    });
    
  }

// Always unavailable tables
    var radomNumber = Math.floor(Math.random() * 6);
    var RESERVED_TABLES = [radomNumber, 2+radomNumber, 7+radomNumber]; 


function defaultPeople(){
    document.getElementById("inputpeople").selectedIndex = 0;
    var defaultPeople = document.getElementById("inputpeople").value;
    document.getElementById("conPeople").innerHTML = defaultPeople;
    mReservationData.people = defaultPeople;
    updateTableStatus();
}

function defaultTime(){
    var field = document.querySelector('#inputtime');
    var today = new Date();
    var hour = today.getHours();
    var index = 0;
    if(hour>19 || hour<9){
        field.selectedIndex = index;   
    }
    else{
        index = (hour-9)*2;
        field.selectedIndex = index;   
    }
    onTimeSelected();
}

function defaultDate(){
    var field = document.querySelector('#inputdate');
    var today = new Date();
    var tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
    tomorrow.setHours(0,0,0,0);
    var hour = today.getHours();
    var defaultDate;
    //Set the default date to tomorrow
    if(hour > 19){
        field.value = tomorrow.getFullYear().toString() + '-' + (tomorrow.getMonth() + 1).toString().padStart(2, 0) + 
        '-' + tomorrow.getDate().toString().padStart(2, 0);
        defaultDate = tomorrow;
    }
    // Set the default date to today
    else{
        field.value = today.getFullYear().toString() + '-' + (today.getMonth() + 1).toString().padStart(2, 0) + 
        '-' + today.getDate().toString().padStart(2, 0);
        defaultDate = today;
    }


    mReservationData.date = defaultDate;
    document.getElementById("conDate").innerHTML = defaultDate.toLocaleDateString();
    updateTableStatus();
}

//Define people select option
function peopleSelectOption(){
    peopleOption="<option value='1' selected>1 Person</option>";
    for(var i = 2; i < 9; i++ ){
        peopleOption += "<option value=\"" + i + "\">" +i +" People</option>";
        document.getElementById("inputpeople").innerHTML = peopleOption + "<option value=\"More than 8\" disabled>More than 8, contact us.</option>";
    }
}

// Get date
function onDateInput(){
    var date = new Date(document.getElementById("inputdate").value);
    today = new Date();
    today.setHours(0,0,0,0);
    validDate = new Date(today.getTime() + (4*24 * 60 * 60 * 1000));
    mReservationData.date = date;
    var reservationDate = getReservationDate();
    if(today > date || date >= validDate){
        showAlertModal("Reservation date only from today and up to next 3 days.");
        defaultDate();
    }
    else if (reservationDate != null && (new Date()) > reservationDate){
        showAlertModal("Sorry, the time is unavailable.");
        defaultDate();
        defaultTime();
    }
    else if (today <= date && date < validDate){
        document.getElementById("conDate").innerHTML = date.toLocaleDateString();
        updateTableStatus();
    }
}

//Get time
function onTimeSelected(){
    var time = document.getElementById("inputtime");
    mReservationData.time = time.selectedIndex;
    var textTime = time.options[time.selectedIndex].text;
    var reservationDate = getReservationDate();
    if(reservationDate != null && (new Date()) > reservationDate){
        showAlertModal("Sorry, the time is unavailable.");
        defaultDate();
        defaultTime();
        return;
    }

    document.getElementById("conTime").innerHTML = textTime;
    updateTableStatus();
}

//Get Reservation Date
function getReservationDate() {
    var selectedDate = mReservationData.date;
    var selectedTimeIndex = mReservationData.time; // 0~21 = 10:00 ~ 20:30
    if (selectedDate == null) {
        return null;
    }
    var selectedTimeHour = 10 + ~~(+selectedTimeIndex / 2);
    var selectedTimeMin = +selectedTimeIndex % 2 == 1 ? 30 : 0;
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
            selectedTimeHour, selectedTimeMin);
}

//Get number of people
function onPeopleSelected(){
    var people = document.getElementById("inputpeople").value;
    document.getElementById("conPeople").innerHTML = people;
    mReservationData.people = people;
    updateTableStatus();
}



//Display Tables
function showTables(){
    //tables img html
    var tableShow = "";
    for(var i = 0; i < mTables.length; i++){
        tableShow += "<img src='img/table/white/"+mTables[i].image+"' alt='table_"+i+"'>";
    }
    //innerhtml
    document.getElementById("allTableContainer").innerHTML = tableShow;

    //Add attribute
    var imgsTables = document.getElementById("allTableContainer").getElementsByTagName("img");
    for(var i = 0; i < imgsTables.length; i++){
        //add id attribute
        imgsTables[i].setAttribute("id", "table" + i);
        //add onclick function
        imgsTables[i].setAttribute("onclick", "onTableSelected(this)");
    }

    addTooltips();
    updateTableStatus();
}

//Add tooptips (library Tippy.js)
function addTooltips(){
    for(var i = 0; i < mTables.length; i++){
        //data for tooltips
        var img = document.getElementById("table"+i);
        var yheight = img.height;
        var peopleAllow = mTables[i].capacity;
        //tooltips
        tippy('#table'+i, {content: "<p style=\"color:black; font-family: 'Athiti';\">Table No. "+(i+1)+"</br>People: "+peopleAllow+"</p>",distance:-yheight*0.5,theme:'light',animation:'shift-away',delay:[300,100]})
    }
}

//Make sure enter the date time and number of people
function checkInputs() {
    var selectedDate = document.getElementById("conDate").textContent;
    var selectedTime = document.getElementById("conTime").textContent;
    var selectedPeople = document.getElementById("conPeople").textContent;
    var selectedlocation = document.getElementById("locationSelect").value;

    if (Boolean(selectedDate)==false){
        return "Please select booking date.";
    }
    if (Boolean(selectedTime)==false){
        return "Please select booking time.";
    }
    if (Boolean(selectedPeople)==false){
        return "Please select number of people.";
    }
    if (Boolean(selectedlocation)==false) {
        return("Please select location.");
    }
    return "";
}

// Select room or deck
function onLocationSelected() {
    var alertString = checkInputs();
    if (alertString != "") {
        showAlertModal(alertString);
        return;
    }
    var selectedlocation = document.getElementById("locationSelect").value;
    mReservationData.location = selectedlocation;
    updateTableStatus();
}

//Click on table image
function onTableSelected(imgClick) {
    var alertString = checkInputs();//Make sure enter the date time and number of people
    if (alertString != "") {
        showAlertModal(alertString);
        return;
    }
    
    var tableid = +imgClick.id.slice(5) + 1;//imgClick.id is "tablex"
    // Check table is available according to criteria
    if (mTables[tableid - 1].tableStatus == 0 || mTables[tableid - 1].tableStatus == 3) { // 0 = unavailable
        return;
    }

    var selectedTable = mReservationData.selectedTable;
    // Already selected this table, so unselect
    mReservationData.selectedTable = selectedTable === tableid ? -1 : tableid;

    var selectedLocationText = document.getElementById("locationSelect");
    if(mReservationData.selectedTable != -1){
        document.getElementById("conTables").innerHTML = selectedLocationText.options[selectedLocationText.selectedIndex].text
                + " - Table No." + mReservationData.selectedTable;
    }
    else{
        document.getElementById("conTables").innerHTML = "";
    }
    updateTableStatus();
}

function updateTableStatus() {
    var imgsTables = document.getElementById("allTableContainer").getElementsByTagName("img");
    var reservationDate = getReservationDate();
    for (var i = 0; i < imgsTables.length; i++) {
        var table = mTables[i];
        var tableStatus = 2; // 2 = available

        // Set to selected if it's the selected table
        if (mReservationData.selectedTable == table.id) {
            tableStatus = 1; // 1 = selected
        };

        // Current table can't accommodate #people, set to unavailable
        if (table.capacity < mReservationData.people) { 
            tableStatus = 0; // 0 = unavilable
        }

        // Set to unavailable if not in the location
        if (mReservationData.location != table.location) {
            tableStatus = 0;
        }

        var bookedDateList = table.booktime;
        if (reservationDate != null) {
            for (var j = 0; j < bookedDateList.length; j++) {
                var bookedDate = bookedDateList[j];
                var diff = reservationDate.getTime() - bookedDate.getTime();
                // Set to unavailable if has book time less than 2 hours before
                if (diff >= 0 && diff < 2 * 3600 * 1000) {
                    tableStatus = 3;
                }
            }
        }

        // 3 tables have fully booked
        if (RESERVED_TABLES.includes(i)) {
            tableStatus = 3;
        }

        // Set to unavailable for deck if wheather is not good or temperature < 18 degree; only today is bookable 
        if (mReservationData.location == "deck" && mReservationData.date != null) {
            if (mReservationData.date.getDate() != (new Date()).getDate()) {
                showWeatherModal("Sorry, you can not book table of deck for the date you selected.");
                //tableStatus = 0;
                document.getElementById("conTables").innerHTML ="";
                document.getElementById("locationSelect").value = "";
                mReservationData.location = null;
            } else if (+mWeatherID < 700 || +mTemp < 18) {
                showWeatherModal("Sorry, the weather is not suitable to sit outside.");
                //tableStatus = 0;
                document.getElementById("conTables").innerHTML ="";
                document.getElementById("locationSelect").value = "";
                mReservationData.location = null;
            }
        }

        // Table not available by filter criteria, return 
        if (mReservationData.selectedTable == table.id && tableStatus == 0) { 
            mReservationData.selectedTable = -1;
            document.getElementById("conTables").innerHTML = "";
        }

        table.tableStatus = tableStatus;
        imgsTables[i].src = getTableImageForStatus(tableStatus, table.id);
    }
}

/**
 * @param {int} status 0 = unavailable, 1 = selected, 2 = available, 3 = booked
 * @param {int} tableId
 */
function getTableImageForStatus(status, tableId) {
    switch (status) {
        case 0: // unavailable
            return "img/table/grey/table_" + tableId + ".gif";
        case 1: // selected
            return "img/table/blue/table_" + tableId + ".gif";
        case 2: // available
            return "img/table/white/table_" + tableId + ".gif";
        case 3: // booked
            return "img/table/red/table_" + tableId + ".gif";
        default:
            return "";
    }
}


//weather API
var mWeatherID;
var mTemp;

//showWeatherModal
function showWeatherModal(message) {
    var modal = document.getElementById("weather");
    var closeButton = document.getElementsByClassName("close")[0];
    closeButton.onclick = function() {
      modal.style.display = "none";
    }
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
    document.getElementById("modalText").innerHTML = message;
    modal.style.display = "block";
}

function showOptionModal(message){
    document.getElementById("optionMessage").innerHTML = message;
    var modal = document.getElementById("option");
    var yesBtn = document.getElementById("yes");
    var noBtn = document.getElementById("no");
    modal.style.display = "block";
    yesBtn.onclick = function(){
        if(message == "Are you sure to clear the reservation?"){
            clearAllData();
        }
        if(message == "Are you sure to confirm the reservation without booking any dish?"){
            showReservationModal();
            cofirm();
        }
        if(message == "Are you sure to confirm the reservation?"){
            showReservationModal();
            cofirm();
        }
        modal.style.display = "none";
    }
    noBtn.onclick = function(){
        modal.style.display = "none";
    }
}

function showAlertModal(message){
    document.getElementById("alertMessage").innerHTML = message;
    var modal = document.getElementById("alert");
    modal.style.display = "block";
    var closeButton = document.getElementById("ok");
    closeButton.onclick = function() {
        modal.style.display = "none";
    }
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
}


function showReservationModal(){
    var selecDate = document.getElementById("conDate").textContent;
    var selectTime = document.getElementById("conTime").textContent;
    var selectPeople = document.getElementById("inputpeople").value;
    var selectedTable = document.getElementById("conTables").textContent;
    document.getElementById("reservationDetail").innerHTML = "Date: "+ selecDate + "<br>" + "Time: "+ selectTime + "<br>" + "People: "+ selectPeople + "<br>" + "Table: "+ selectedTable;
    var modal = document.getElementById("reservationModal");
    modal.style.display = "block";
    var closeButton = document.getElementById("done");
    closeButton.onclick = function() {
        modal.style.display = "none";
    }
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
}

function cofirm(){
        // Save selected date/time, so no one can order it later
        var selectedTable = mReservationData.selectedTable;
        mTables[selectedTable - 1].booktime.push(getReservationDate());
        clearAllData();
    }

// Sets table's booktime to the selected time
function onConfirmClicked() {
    var selectedDishes =document.getElementById("money").textContent;
    var selectedTable = mReservationData.selectedTable;
    if (selectedTable != -1 && selectedDishes != "") {
        showOptionModal("Are you sure to confirm the reservation?");
    } 
    else if(selectedTable != -1 && selectedDishes == ""){
        showOptionModal("Are you sure to confirm the reservation without booking any dish?");
    }
    else {
        showAlertModal("Please select your table.");
    }
}

function onCancelClicked() {
    var selectedTable = document.getElementById("conTables").textContent;
    var selectedDishes =document.getElementById("money").textContent;
    if(selectedTable != "" || selectedDishes != ""){
        showOptionModal("Are you sure to clear the reservation?");
    }
    else{
        showAlertModal("Please select your table.");
    }
}

function clearAllData() {
    mReservationData = new ReservationData(-1, null, 0, 0, 0);
    defaultDate();
    defaultTime();
    defaultPeople();
    for (var table in mTables) {
        table.tableStatus = 2;
    }
    // Clear UI
    document.getElementById("locationSelect").value = "";
    document.getElementById("conTables").innerHTML = "";
    document.getElementById("conDishes").innerHTML = "<div style=\"border-bottom: 1px dotted rgba(0, 0, 0, 0.3); padding-top: 2.5vw;\"></div>";
    mCurrentCartDishOrder = [];
    mCurrentCartDishes = new Map(); 
    var dishQuantityCell = document.querySelectorAll("[id*='quantity']");
    for (i = 0; i < dishQuantityCell.length; i++){
        dishQuantityCell[i].innerHTML = 0;
    }

    document.getElementById("money").innerHTML = "";
    updateTableStatus();
}



//Display dish
function showDishes(){
    var dishshow = "";
    for(var i = 0; i < mDishes.length; i++){
        dishshow = dishshow+"<table><tr><td colspan=\"4\"><img src=\"img/"+ mDishes[i].image+"\"</td></tr>"+
        "<tr><td colspan=\"4\" >"+mDishes[i].name+"</td></tr>"+
        "<tr><td colspan=\"4\" >"+mDishes[i].description+"</td></tr>"+
        "<tr><td colspan=\"4\" >"+mDishes[i].typeindication+"</td></tr>"+
        "<tr><td>$ "+mDishes[i].cost+"</td>"+
        "<td style=\"text-align: center;\"><button id=\"add"+i+"\" onclick=\"adddish("+i+")\">+</button></td>"+
        "<td style=\"text-align: center;\" id=\"quantity"+i+"\">0</td>"+
        "<td style=\"text-align: center;\"><button id=\"reduce"+i+"\" onclick=\"reducedish("+i+")\">-</button></td></tr></table>";
        document.getElementById("dishesTable").innerHTML = dishshow;
    }
}

//Add dish to cart
//Define class for cartdish
function CartDish(index, name, cost, quantity){
    this.index = index;
    this.name = name;
    this.cost = cost;
    this.quantity = quantity;
}

// This dictionary contains the current items in the cart
var mCurrentCartDishes = new Map(); 
// Stores the order of the dishes
var mCurrentCartDishOrder = []; 
//Add dish
function adddish(selectedDishIndex) {
    var dish = mCurrentCartDishes.get(selectedDishIndex);
    if (dish == null) {
        // Dish is not in the cart yet, put it into cart
        dish = new CartDish(selectedDishIndex, mDishes[selectedDishIndex].name, mDishes[selectedDishIndex].cost, 1);
        mCurrentCartDishes.set(selectedDishIndex, dish);
        mCurrentCartDishOrder.push(selectedDishIndex);
    } else {
        // Dish already in cart, increase quantity
        dish.quantity = dish.quantity + 1;
    }
    document.getElementById("quantity"+selectedDishIndex).innerHTML = dish.quantity;
    displayCartDishes();

}

//Reduce dish
function reducedish(selectedDishIndex){
    var dish = mCurrentCartDishes.get(selectedDishIndex);
    if (dish == null) {
        showAlertModal("Please add a dish first.");
    } else {
        // Dish already in cart, decrease quantity
        if (dish.quantity == 1) {
            // Remove from mCurrentCartDishOrder if quantity is reducing to 0
            for (var i = 0; i < mCurrentCartDishOrder.length; i++) {
                var dishIndex = mCurrentCartDishOrder[i];
                if (dishIndex === selectedDishIndex) {
                    mCurrentCartDishOrder.splice(i, 1);
                }
            }
            dish.quantity = 0;
            mCurrentCartDishes.delete(selectedDishIndex);
        } else if (dish.quantity > 1) {
            dish.quantity = dish.quantity - 1;
        } // Do nothing if quantity is already 0
    }
    document.getElementById("quantity"+selectedDishIndex).innerHTML = dish.quantity;
    displayCartDishes();
}

//Display dishes on cart field
function displayCartDishes(){
    var total = 0;
    var selectedDishDisplay = "<table style=\"width:100%;\">";
    for (i = 0; i < mCurrentCartDishOrder.length; i++) {
        var index = mCurrentCartDishOrder[i];
        var dish = mCurrentCartDishes.get(index);
        var subTotalCost = dish.cost * dish.quantity;
        selectedDishDisplay += "<tr><td>" + dish.name + "</td>" +
                "<td>*" + dish.quantity + "</td>" +
                "<td>$" + subTotalCost + "</td></tr>";
        total += dish.cost * dish.quantity;
    }
    document.getElementById("conDishes").innerHTML = selectedDishDisplay + "</table>";
    document.getElementById("money").innerHTML = "$" +total;
    if(total == 0){
        document.getElementById("conDishes").innerHTML = "<div style=\"border-bottom: 1px dotted rgba(0, 0, 0, 0.3); padding-top: 2.5vw;\"></div>";
        document.getElementById("money").innerHTML = "";
    }
}

   


