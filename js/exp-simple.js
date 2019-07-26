
// ----
// Instruction block
// ----

var welcome_message = "<div id='instructions'><p>Welcome to the " +
   "experiment about decision making. You will be making choices between 3 alternatives for 4 rounds. Alternatives will be presented as card pictures and you will be able to make a choice by clicking with a mouse on a card. By using ENTER key you will be able to advance to the new round.</p> <p>Now press ENTER key to begin with the experiment.</p></div>";


var instruction_block = {
    type: "text", 
    text:[welcome_message],
    cont_key: [13],
    timing_post_trial: 111  // in ms units
};


// ----
// Stimuli presentation block
// ----

// stimuli array has a specific form that contains information about what
// to show in each trial in a stimuli, for simplicity we manually
// construct the array here, but you would probably define a function
// that would do that for you depending on some parameters
var stimuli_trials = [
  {stimuli:[
    {stimulus:'img/cardBlue.jpg', value: 20, pos: [1,1], label: "Option A"},
    {stimulus:'img/cardRed.jpg', value: 10, pos: [1,2], label: "Option K"},
    {stimulus:'img/cardBlack.jpg', value: 15, pos: [1,3], label: "Option Z"},
    ], 
    show_feedback: 1
  },
  {stimuli:[
    {stimulus:'img/cardBlue.jpg', value: 25, pos: [1,1], label: "Option A"},
    {stimulus:'img/cardRed.jpg', value: 0, pos: [1,2], label: "Option K"},
    {stimulus:'img/cardBlack.jpg', value: 15, pos: [1,3], label: "Option Z"},
    ], 
    show_feedback: 1
  },
  {stimuli:[
    {stimulus:'img/cardBlue.jpg', value: 30, pos: [1,1], label: "Option A"},
    {stimulus:'img/cardRed.jpg', value: 4, pos: [1,2], label: "Option K"},
    {stimulus:'img/cardBlack.jpg', value: 15, pos: [1,3], label: "Option Z"},
    ], 
    show_feedback: 1
  },
  {stimuli:[
    {stimulus:'img/cardBlue.jpg', value: 27, pos: [1,1], label: "Option A"},
    {stimulus:'img/cardRed.jpg', value: 3, pos: [1,2], label: "Option K"},
    {stimulus:'img/cardBlack.jpg', value: 15, pos: [1,3], label: "Option Z"},
    ], 
    show_feedback: 1
  },
]

// bandit plugin block
var test_block = {
    type: "bandit", 
    grid_size:[3,1],  // size of the grid for option placement
    timeline: stimuli_trials,
    // optional parameters
    timing_stim:-1,  // unlimited time
    show_balance: true,  // show cumulative total
    timing_post_trial: 1000,  
    feedback_continue_key: true,  // person needs to press a key to advance
    continue_key: [13],  // ENTER key
    prompt: "Click with a mouse to choose an option. Press ENTER to continue to the next trial."  // message to show below an option
};



// ----    
// End of exp message
// ----

var subjectID = Math.round(Math.random()*100000000);

var debrief = "<div id='instructions'><p>Thank you for" +
  " participating! </p>" + 
  "<p>Please save or write down the following number: " + 
  subjectID + ", press ENTER to finish the experiment and then fill in the number back in the Amazon Turk screen.</p></div>";

var debrief_block = {
    type: "text", 
    text: [debrief],
    cont_key: [13]
};


// ----
// Run Experiment
// ----

jsPsych.init({
  timeline: [
    instruction_block, 
    test_block, 
    debrief_block
  ],
  on_finish: function() {
    jsPsych.data.displayData();
  }
});
