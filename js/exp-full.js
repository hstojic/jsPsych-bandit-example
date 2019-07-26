// ----
// Parameters
// ----

var divider = 1800;
var showUpFee = 0.7;
var exp_cond = Math.floor(Math.random() * 2) + 1;
if (exp_cond == 1) { 
    var bandit = "FMAB"; 
} else {
    var bandit = "MAB"; 
}


// ----
// Instructions & questionnaires
// ----


// demographic questionnaire
var validate_demo_questions = function(elem, data) {
  
    // extract inputs
    var Q0 = data.Q0;  
    var Q1 = data.Q1;

    // no answer leaves them undefined
    Q0 = (typeof Q0 === 'undefined') ? '' : Q0;
    Q1 = (typeof Q1 === 'undefined') ? '' : Q1;

    // basic check if left blank, perhaps remove first question and 
    // then demand that all answers are numbers?
    if (Q0 === '' || Q1 === '' ||  
       Q0 === null || Q1 === null){
        alert('Please answer all questions.');
        return false;
    } else {
        return true;
    }
};
var demo_questions = {
    "0": {"questText":"What is your gender?", 
          "questType":["multiple choice", "radio"], 
          "questChoice": ["Male", "Female", "Do not wish to answer"]
         },
    "1": {"questText":"How old are you?", "questType":["text", "single"] }
};
var demo_questions_block = {
    type: "questionnaire", 
    instructions: ["<h1>Questionnaire</h1><p>Before finishing with the experiment we would like to ask you few questions.</p>"],
    numbered: true,
    questions: demo_questions,
    check_fn: validate_demo_questions,
    timing_post_trial: 111  // in ms units
};

// we check the attention after the instructions
var validate_att_questions = function(elem, data) {
   
    // extract inputs
    var Q0 = data.Q0;  // does not work in IE<9
    var Q1 = data.Q1;
    var Q2 = data.Q2;
    var Q3 = data.Q3;

    // no answer leaves them undefined
    Q0 = (typeof Q0 === 'undefined') ? '' : Q0;
    Q1 = (typeof Q1 === 'undefined') ? '' : Q1;
    Q2 = (typeof Q2 === 'undefined') ? '' : Q2;
    Q3 = (typeof Q3 === 'undefined') ? '' : Q3;

    // basic check if left blank, perhaps remove first question and then demand that all answers are numbers?
    if(Q0 === '' || Q1 === '' || Q2 === '' || Q3 === '' || Q0 === null || Q1 === null || Q2 === null || Q3 === null){
        alert('Please answer all questions.');
        return false;
    } else {    
        var no_correct = 0;
        if (Q0 === "Yes") no_correct += 1; 
        if (Q1 === "60s") no_correct += 1; 
        if (Q2 === "0.7") no_correct += 1; 
        if (Q3 === "None of the above") no_correct += 1; 

        if (no_correct === 4) {
            alert('Great! All questions answered correctly and you can proceed to the game.');
            return true;
        } else {
            alert('Unfortunately, at least one answer is incorrect. We are returning you to read the instructions again.');
            return jsPsych.resetTimeline();
        }
    }
};
var att_questions = {
    "0": {"questText":"In the game you choose between a number of options. Do you get the same set of options in all 10 rounds in the game?",
          "questType":["multiple choice", "radio"],
          "questChoice": ["Yes", "No", "I am not sure"]
          },
    "1": {"questText":"How much time do you have to make a choice in each round?",
          "questType":["multiple choice", "radio"],
          "questChoice": ["Unrestricted", "30s","40s","60s","None of the above"]
          },
    "2": {"questText":"What is the fixed payment in US dollars you will receive regardless of your performance in the experiment?",
          "questType":["multiple choice", "radio"],
          "questChoice": [showUpFee, "0.4","1","0.25","None of the above"]
         },
    "3": {"questText":"For the earnings based on your performance, how many experimental points will be exchanged for 1 US dollar?",
          "questType":["multiple choice", "radio"],
          "questChoice": ["2000", "1200","4200","500","None of the above"]
         }
    };
var att_questions_block = {
    type: "questionnaire", 
    instructions: ["Before you start with the experiment we would like to check how well you can recall some information from the instructions. You can continue with the experiment only if you answer all questions correctly. In case any answer is incorrect you will be returned to instructions."],
    numbered: true,
    questions: att_questions,
    check_fn: validate_att_questions,
    timing_post_trial: 111  // in ms units
};

// bandit task instructions
var inst_bandit_block = {
    type:'instructions', 
    pages: [
        "instructions/cond-" + bandit + "-welcome.html",
        "instructions/cond-" + bandit + "-bandit-1.html",
        "instructions/cond-" + bandit + "-bandit-2.html",
        "instructions/cond-" + bandit + "-bandit-3.html",
        "instructions/cond-" + bandit + "-bandit-4.html",
        "instructions/cond-bandit-5.html"
        ],
    urls: true,
    show_clickable_nav: true,
    allow_keys: false
};

// goodbye message
var goodbye = {
    type:'html',
    url: "instructions/cond-" + bandit + "-goodbye.html",
    cont_btn: "finish",
    timing_post_trial: 111
};


// ----    
// Earnings reports & Debrief
// ----

var get_exp_points = function() {
    
    // exp task
    var bandit_trials = jsPsych.data.getTrialsOfType('bandit');
    var no_trials = bandit_trials.length;
    var exp_points_choice = bandit_trials[no_trials-1].balance;

    return {
        exp_points_choice: exp_points_choice
    }
};

var performance_feedback_block = {
    type: "text",
    text: function() {
        var earnings = get_exp_points();
        var earnings_report = '<div class="text-justify" id="instructions"><h1>Performance in the game</h1><p>Until now you have earned ' + parseFloat(parseFloat(earnings.exp_points_choice).toFixed(2)) + ' experimental points with your choices.</p><button type="button" class="btn btn-default" id="continue">Continue!</button></div>';
        return earnings_report;
    },
    cont_key: "mouse",
    cont_btn: "continue"
};

var earnings_info_block = {
    type: "text",
    text: function() {

        var earnings = get_exp_points();
        var earnings_total = earnings.exp_points_choice;
        var earnings_total_EP = parseFloat(parseFloat(earnings_total).toFixed(2));
        var earnings_total_dollar = parseFloat(parseFloat(earnings_total/divider).toFixed(2));

        var earnings_report = '<div class="text-justify" id="instructions"><h1>Earnings in the experiment</h1><p>Based on your performance in the experiment you have earned ' + earnings_total_EP + ' experimental points.</p><p>Translated to US dollars, this amounts to ' + earnings_total_dollar + ' US dollars. This amount is obtained by dividing amount of experimental points by '+ divider +', as instructed at the beginning of the experiment. Together with the fixed payment for participating in the experiment of ' + showUpFee + ' US dollars, your final earnings are ' + parseFloat(parseFloat(earnings_total_dollar + showUpFee).toFixed(2)) + ' US dollars</p><button type="button" class="btn btn-default" id="continue">Continue!</button></div>';

        return earnings_report;
    },
    cont_key: "mouse",
    cont_btn: "continue"
};



// ----
// Specify bandit stimuli
// ----
    
// bandit stimuli
var features = {
    all:[[0.25,0.35],[0.25,0.35]],
    alm:[[0.25,0.35],[0.45,0.55]],
    alh:[[0.25,0.35],[0.65,0.75]],
    aml:[[0.45,0.55],[0.25,0.35]],
    amm:[[0.45,0.55],[0.45,0.55]],
    amh:[[0.45,0.55],[0.65,0.75]],
    ahl:[[0.65,0.75],[0.25,0.35]],
    ahm:[[0.65,0.75],[0.45,0.55]],
    ahh:[[0.65,0.75],[0.65,0.75]]
};

var stim_specs = {
    bandit_type: bandit,
    no_arms:9,
    no_trial:10,
    grid_size:[6,3],
    arm_names:["all", "alm", "alh","aml","amm","amh","ahl","ahm","ahh"],
    features:features,
    feat_fnc: runif,
    noise_mean:0,
    noise_var:4,
    noise_fnc: rnorm,
    weights: [-20,-10],
    reward_fnc: function(w,x) {return 35 + w[0]*x[0] + w[1]*x[1]},
    rand_feat: true,
    rand_pos: true,
    labels: ["B", "D", "E", "H", "M", "S", "V", "K", "Q", "L"]
}

// generate random vector that would work for both training and test
// stimuli
var rand_feat = shuffle([0,1]).array; 

// generate bandit stimuli
var stimuli_bandit = gen_bandit_stimuli(stim_specs, rand_feat);


/* define parameters of the bandit jsPsych block */
var bandit_block = {
  "type":"bandit",
  "grid_size":[6,3],
  "is_html":true,
  "timeline":stimuli_bandit,
  "initial_balance":0,
  "dec_point":1,
  "choice_key":"mouse",
  "timing_stim":60000,
  "timing_onset":-1,
  "timing_post_trial":-1,
  "timing_feedback_duration":2000,
  "timeout_message": '<p id="timeout_message" class="text-justify">Please respond faster.</p>',
  "show_balance":false,
  "show_trial_total":" of 10",
  "show_trial_count":"Round ",
  "show_balance": "Total: ",
  "show_time_trial":"Time left: ",
  "prompt": "<div class='text-justify'><p>Click on an option to choose it. You will then see the number of points earned below the option. You have 60 seconds to make a choice.</p><p>If you cannot see all the options without scrolling, you can press CTRL key and -/+ key to zoom out/in.</p></div>"
} 



// define experiment blocks
var experiment_blocks = [
    inst_bandit_block,
    att_questions_block,
    bandit_block,
    performance_feedback_block,
    earnings_info_block,
    demo_questions_block,
    goodbye
];


// ----
// Starting experiment
// ----

jsPsych.init({
    timeline: experiment_blocks,
    on_finish: function() {
      jsPsych.data.displayData();
    }
});

