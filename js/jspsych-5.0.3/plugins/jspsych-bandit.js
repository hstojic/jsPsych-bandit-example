/**
 * 
 * Hrvoje Stojic
 * July 2019
 *
 * Created a plugin for running multi-armed bandit experiments with the help 
 * of jsPsych library. For more information about the plugin see 
 * https://github.com/hstojic/jspsych-bandit-plugin
 */

jsPsych.plugins['bandit'] = (function(){

    // debugging mode
    var debug = false;
    if (debug) console.log("Debug mode ON!")

    // private variables for transferring some info between the trials
    var balance = 0;
    var balance_pred = 0;
    var trials_completed = 0;
    var chosen_arm_prev = 0;
    

    // -----------------------------------------------------------------
    // Defining some useful functions 
    // -----------------------------------------------------------------
    
    // R like function for creating an array of numbers consisting of same elements
    var rep = function(symbol, noTimes) {
        var index = [];
        for (var j = 0; j < noTimes; j++) index.push(symbol);
        return index
    };

    // simple sum function, vec is an array of numbers or booleans
    var sum = function(vec) {
        // basic assertions
        if(vec.constructor !== Array) {
            throw new Error("Vector is not an array as required")
        }
        
        // we sum
        var result = 0;
        for (var j = 0; j < vec.length; j++) {
            result = result + vec[j];
        }
        // finally we return a scalar
        return(result)
    };

    // sampling with probability function
    var sample = function(values, prob) {

        // get CDF from prob array 
        var prob_cum = [];
        var sum_prob = sum(prob);
        var hh = 0;
        for (var i = 0; i < prob.length; i++) {
            hh += prob[i]
            prob_cum.push(hh / sum_prob);
        }

        // sample one item from it
        var rand_unif = Math.random();
        var idx = 0;
        while(rand_unif > prob_cum[idx]) idx++;

        // we have an index of the element
        return values[idx]
    }

    var plugin = {};

    jsPsych.pluginAPI.registerPreload('bandit', 'stimuli', 'image');

    plugin.trial = function(display_element, trial) {


        // -------------------------------------------------------------
        // Getting and setting the parameters
        // -------------------------------------------------------------

        //  getting the values of obligatory parameters first, 
        //  ones that determine the behavior of the plugin significantly
        if (typeof trial.stimuli === 'undefined') {
            alert("Fatal error, stimuli parameter not defined!")
        } 
        if (typeof trial.grid_size === 'undefined') {
            alert("Fatal error, grid_size parameter not defined!")
        } 
        
        // some parameters that can be optionally specified by the user 
        // type of stimuli, initial balance and formatting EPs
        trial.is_html = (typeof trial.is_html === 'undefined') ? false : trial.is_html;
        trial.initial_balance = (typeof trial.initial_balance === 'undefined') ? 0 : trial.initial_balance;
        trial.dec_point = (typeof trial.dec_point === 'undefined') ? 1 : trial.dec_point;

        // keys
        trial.choice_key = (typeof trial.choice_key === 'undefined') ? "mouse" : trial.choice_key;
        trial.continue_key = (typeof trial.continue_key === 'undefined') ? 13 : trial.continue_key;
        trial.feedback_continue_key = (typeof trial.feedback_continue_key === 'undefined') ? false : trial.feedback_continue_key;
        
        // timing of stages
        trial.timing_stim = (typeof trial.timing_stim === 'undefined') ? -1 : trial.timing_stim;
        trial.timing_onset = (typeof trial.timing_onset === 'undefined') ? 10 : trial.timing_onset;
        trial.timing_feedback_duration = (typeof trial.timing_feedback_duration === 'undefined') ? 2000 : trial.timing_feedback_duration;
        trial.timing_post_trial = (typeof trial.timing_post_trial === 'undefined') ? 1000 : trial.timing_post_trial;
        trial.timing_predictions = (typeof trial.timing_predictions === 'undefined') ? -1 : trial.timing_predictions;
        trial.timeout_message = (typeof trial.timeout_message === 'undefined') ? "<p>Please respond faster.</p>" : trial.timeout_message;

        // show additional info
        trial.show_balance = (typeof trial.show_balance === 'undefined') ? false : trial.show_balance;
        trial.show_trial_total = (typeof trial.show_trial_total === 'undefined') ? false : trial.show_trial_total;
        trial.show_trial_count = (typeof trial.show_trial_count === 'undefined') ? false : trial.show_trial_count;
        trial.show_time_trial = (typeof trial.show_time_trial === 'undefined') ? false : trial.show_time_trial;

        // predictions and confidence questions 
        trial.ask_predictions = (typeof trial.ask_predictions === 'undefined') ? 0 : trial.ask_predictions;
        trial.ask_confidence = (typeof trial.ask_confidence === 'undefined') ? false : trial.ask_confidence;
        trial.check_pred_fn = (typeof trial.check_pred_fn === 'undefined') ? (function(data) { return true }) : trial.check_pred_fn;
        check_pred_fn = trial.check_pred_fn;
        delete trial.check_pred_fn;
        trial.pred_earn_fn = (typeof trial.pred_earn_fn === 'undefined') ? (function(x,y,z) { return 0 }) : trial.pred_earn_fn;
        pred_earn_fn = trial.pred_earn_fn;
        delete trial.pred_earn_fn;
        

        // header and footer 
        //trial.header = (typeof trial.header === 'undefined') ? '' : trial.header;
        trial.prompt = (typeof trial.prompt === 'undefined') ? '' : trial.prompt;
        trial.prompt_predictions = (typeof trial.prompt_predictions === 'undefined') ? trial.prompt : trial.prompt_predictions;

        // add few useful variables
        trial.no_arms = trial.stimuli.length;


        // -------------------------------------------------------------
        // Defining functions
        // -------------------------------------------------------------

        
        // we put presentation of the stimuli in a function
        var present_stimuli = function() {
            
            if (debug) console.log("Stimuli onset")

            // appending header
            display_element.append($('<div>', {
              "id": 'header'
            }));


            // collecting everything that should go into header, above the screen part with the bandits
            if (trial.show_trial_total) {
                var show_trial_total = trial.show_trial_total;
            } else {var show_trial_total ='';}

            if (trial.show_trial_count) {
                var show_trial_count = trial.show_trial_count + (trials_completed+1);
            } else {var show_trial_count ='';}

            $("#header").append($('<div>', {
                "html": '<div id="show_trial_count">' + show_trial_count + show_trial_total + ' </div>',
                "id": 'trials_info'
            }));

            // time left in the trial
            if (trial.show_time_trial) {
                $("#header").append($('<div>', {
                    "html": trial.show_time_trial + parseFloat(time_left/1000).toFixed(0),
                    "id": 'show_time_trial'
                }));
            } 

            if (debug) console.log("Balance: ", balance, " Balance pred: ", balance_pred)
            if (trial.show_balance) {
                $("#header").append($('<div>', {
                    "html": trial.show_balance + parseFloat(parseFloat(balance).toFixed(trial.dec_point)),
                    "id": 'balance'
                }));
            }

            // appending general bandit area
            display_element.append($('<div>', {
              "id": 'bandit_area'
            }));
                        
            // intialize grid
            var gridHTML='', WIDTH=trial.grid_size[0], HEIGHT=trial.grid_size[1];
            for (var i = 1; i <= HEIGHT; i++){
                gridHTML += '<tr>';
                for (var j = 1; j <= WIDTH; j++){
                  gridHTML += '<td align="center" class="arm_frames"><div id="arm_frame_' + i + 'x' + j + '"></div></td>';
                }
                gridHTML += '</tr>';
            }
            //append grid HTML at grid div
            $('#bandit_area').append(gridHTML);
            
            // arms are added dynamically, depending on the variable "no_arms"
            for (var arm = 0; arm < trial.no_arms; arm ++) {

                // extracting slot where the arm should be placed
                var pos = trial.stimuli[arm].pos;

                // arm label
                $('#arm_frame_' + pos[0]+'x'+pos[1]).append($('<div>', {
                    "html": trial.stimuli[arm].label,
                    "class": "arm_labels"
                }));

                // adding arm stimuli, 
                // images 
                if (!trial.is_html) {
                    $('#arm_frame_' + pos[0]+'x'+pos[1]).append($('<img>', {
                      "src": trial.stimuli[arm].stimulus,
                      "id": "arm_" + arm,
                      "class": "arm_img" 
                    }));

                // or HTML shapes
                } else {
                    $('#arm_frame_' + pos[0]+'x'+pos[1]).append($('<div>', {
                      "html": trial.stimuli[arm].stimulus,
                      "id": "arm_" + arm,
                      "class": "arm" 
                    }));           
                };
                
                // adding feedback below the arm
                if (trial.show_feedback !== 0) {
                    $('#arm_frame_' + pos[0]+'x'+pos[1]).append($('<div>', {
                      "html": arm_values[arm],
                      "class": "arm_values" 
                    }));
                }; 
            };

            // appending footer, below the screen part with the bandits
            display_element.append($('<div>', {
                "id": 'footer'
            }));

            // prompt
            $("#footer").append($('<div>', {
                "html": trial.prompt,
                "id": 'prompt'
            }));

            // we keep the stimuli and not allowing for reactions until
            // timing_onset expires
            if (trial.timing_onset > 0) {
                set_timeout_handlers.push(setTimeout(function() {
                    return true;
                }, trial.timing_onset));
            };
        }; // end of the function present_stimuli


        // create response function
        var after_response = function(info) {
            
            // kill any remaining setTimeout handlers
            for (var i = 0; i < set_timeout_handlers.length; i++) {
                clearTimeout(set_timeout_handlers[i]);
            }

            // clear keyboard listener
            jsPsych.pluginAPI.cancelAllKeyboardResponses();

            // special case is if there was no response
            if (info.key === -1) {
                var chosen_arm_data = null;
                var chosen_value = null;
                var switch_ind = null;
            
            // get the ID of the chosen arm, from left to right they are 
            // marked from 0 to k arms; if the choice_key was mouse, 
            // info.key variable is actually chosenArm variable; 
            } else {
                if (trial.choice_key === 'mouse') {
                    var chosen_arm = info.key;
                } else {
                    var chosen_arm = trial.choice_key.indexOf(info.key);
                }
                var chosen_arm_data = parseInt(chosen_arm) + 1;
                var chosen_value = trial.stimuli[chosen_arm].value;

                if (trials_completed===0) {var switch_ind = 1}
                else {
                    if (chosen_arm===chosen_arm_prev) {var switch_ind = 0}
                    else {var switch_ind = 1}    
                }
                
                // updating global private vars
                balance += chosen_value;
                chosen_arm_prev = chosen_arm; 
            }         

            // updating the data variable with the output
            trial_data = {
              "trial": trials_completed + 1,
              "chosenArm": chosen_arm_data,
              "choiceRT": info.rt,
              "reward": chosen_value,
              "switch": switch_ind,
              "balance": balance,
              "balance_pred": balance_pred
            };
                                          
            // cleaning the screen
            display_element.html('');
          
            // going to the next stage
            // showing the feedback or asking predictions
            if (trial.ask_predictions === 0 || trial.ask_predictions === 2) {
                var timeout = info.rt == -1;
                show_feedback(chosen_arm, timeout);
            } else {
                var timeout = info.rt == -1;
                ask_predictions(chosen_arm, timeout);
            }
        }


        // defining a function for ending the trial
        // if there is a timeout we repeat the trial instead
        function end_trial(timeout) {
            if (timeout) {
                display_element.html("");
                jsPsych.finishTrial(trial_data, true);
            } else {
                trials_completed += 1;
                display_element.html("");
                jsPsych.finishTrial(trial_data);
            }
        }


        // defining a function for showing the feedback
        function show_feedback(chosen_arm, timeout) {
            
            if (debug) console.log("Showing feedback")

            // clear keyboard listener
            jsPsych.pluginAPI.cancelAllKeyboardResponses();

            // if stimulus presentation ended before the response 
            // we show a message
            if (timeout) {

                // presenting the stimuli, with timeout message
                present_stimuli();
                document.getElementById('bandit_area').style.visibility = 'hidden';
                $('#prompt').html("");
                $('#prompt').append(trial.timeout_message);
                
            // otherwise we display the stimuli with the feedback
            } else {
                                        
                // setting the arm values as a feedback 
                if (trial.show_feedback === 2) { 
                    if (debug) console.log("show full feedback")
                    for (var arm=0; arm<trial.no_arms; arm++) {
                        arm_values[arm] = parseFloat(parseFloat(trial.stimuli[arm].value).toFixed(trial.dec_point)); }
                } else if (trial.show_feedback === 1) {
                    if (debug) console.log("show partial Feedback")
                    arm_values[chosen_arm] = parseFloat(parseFloat(trial.stimuli[chosen_arm].value).toFixed(trial.dec_point));
                } 
                if (debug) console.log("Arm values: ", arm_values) 

                // presenting the updated stimuli, with feedback
                present_stimuli();

                // we higlight the arm we have chosen
                if(!trial.is_html) {
                    $('#arm_img_' + chosen_arm).toggleClass("highlighted_arm_img");
                } else {
                    $('#arm_' + chosen_arm).toggleClass("highlighted_arm");
                }
            }

            // check if force button press is set
            if (trial.feedback_continue_key) {
                
                var after_forced_response = function(info) {
                    trial_data["feedbackRT"] = info.rt;
                    display_element.html('');
                    // asking predictions if instructed
                    if (trial.ask_predictions === 2) {
                        ask_predictions(chosen_arm, timeout);
                    } else {
                        end_trial(timeout);
                    }
                }
                jsPsych.pluginAPI.getKeyboardResponse({
                  callback_function: after_forced_response,
                  valid_responses: trial.continue_key,
                  rt_method: 'date',
                  persist: false,
                  allow_held_key: false
                });
            } else {
                setTimeout(function() {
                    trial_data["feedbackRT"] = trial.timing_feedback_duration;
                    display_element.html('');
                    // asking predictions if instructed
                    if (trial.ask_predictions === 2) {
                        ask_predictions(chosen_arm, timeout);
                    } else {
                        end_trial(timeout);
                    }
                }, trial.timing_feedback_duration);
            }

        }  // end of show_feedback function


        // defining a function for prediction and confidence questions
        function ask_predictions(chosen_arm, timeout) {
            
            if (debug) console.log("Asking predictions")        

            // remove feedback and present stimuli again 
            arm_values = rep(" ", trial.no_arms);
            present_stimuli();
            if (trial.pred_alert) {
                alert(trial.pred_alert)
            }  

            // private variables 
            var pred_start_time = (new Date()).getTime();
            var arm_inputs_OK = rep(false, trial.no_arms);
            var arm_inputs_idx = rep(false, trial.no_arms);
            var arm_pred = rep(false, trial.no_arms);
            var arm_conf = rep(false, trial.no_arms);
            var earn_pred = rep(false, trial.no_arms);
            var pred_RT = rep(false, trial.no_arms);

            // update the stimuli with prediction forms
            for(var arm = 0; arm < trial.no_arms; arm ++) {

                // extracting slot where the arm should be placed
                var pos = trial.stimuli[arm].pos;

                // ask predictions form
                if (trial.stimuli[arm].prediction) {
                    $('#arm_frame_' + pos[0]+'x'+pos[1]).append($('<div>', {
                        "html": '<form action=""><input name="arm_pred_name_' + arm + '" type="text" id="arm_pred_' + arm + '" class="prediction_form_text" placeholder=' + trial.pred_placeholder + '></form>',
                        "class": "prediction_forms"
                    }));
                    arm_inputs_idx[arm] = true;
                    $("#arm_pred_" + arm).on('keyup keypress', function(e) {
                        var keyCode = e.keyCode || e.which;
                        if (keyCode === 13) { 
                            e.preventDefault();
                            return false;
                        }
                    });
                
                    // ask confidence form
                    if (trial.ask_confidence) {
                        $('#arm_frame_' + pos[0]+'x'+pos[1]).append($('<div>', {
                            "html": '<form action=""><input name="arm_conf_name" type="text" id="arm_conf_' + arm + '"class="confidence_form_text" placeholder=' + trial.conf_placeholder + '></form>',
                            "class": "confidence_forms"
                        }));
                        $("#arm_conf_" + arm).on('keyup keypress', function(e) {
                            var keyCode = e.keyCode || e.which;
                            if (keyCode === 13) { 
                                e.preventDefault();
                                return false;
                            }
                        });
                    } 

                    // add a submit button
                    $('#arm_frame_' + pos[0]+'x'+pos[1]).append($('<button>', {
                        'id': 'submit_arm_' + arm,
                        'class': 'btn btn-default'
                    }));
                    $('#submit_arm_' + arm).html('Submit');
                    $('#submit_arm_' + arm).click(function() {
                        // get arm ID 
                        var button_ID = this.id;
                        var arm_ID = button_ID.split("_")[2];
                        var arm_pred_id = document.getElementById('arm_pred_' + arm_ID);
                        
                        // measure response time
                        pred_RT[arm_ID] = (new Date()).getTime() - pred_start_time;

                        // extract values
                        var data = {};
                        arm_pred[arm_ID] = parseInt(arm_pred_id.value);
                        data['arm_pred'] = arm_pred[arm_ID];

                        if (trial.ask_confidence) {
                            arm_conf[arm_ID] = parseInt(document.getElementById('arm_conf_' + arm_ID).value);
                            data['arm_conf'] = arm_conf[arm_ID];
                        }

                        // check the values                 
                        if (check_pred_fn && !check_pred_fn(trial, data)) {
                            $('#arm_pred_' + arm_ID).toggleClass("prediction_form_text", true);
                            $('#arm_conf_' + arm_ID).toggleClass("confidence_form_text", true);
                            $('#arm_pred_' + arm_ID).toggleClass("prediction_form_text_OK", false);
                            $('#arm_conf_' + arm_ID).toggleClass("confidence_form_text_OK", false);
                            return;
                        } else {
                            earn_pred[arm_ID] = pred_earn_fn(trial.stimuli[arm_ID].exp_value, trial.stimuli[arm_ID].value, arm_pred[arm_ID]);
                            arm_inputs_OK[arm_ID] = true;
                            $('#arm_pred_' + arm_ID).toggleClass("prediction_form_text_OK", true);
                            $('#arm_conf_' + arm_ID).toggleClass("confidence_form_text_OK", true);
                            $('#arm_pred_' + arm_ID).toggleClass("prediction_form_text", false);
                            $('#arm_conf_' + arm_ID).toggleClass("confidence_form_text", false);
                        }
                    });  // end of submit button function on click
                }
            };  // end of adding elements to the stimuli

            // add prediction specific instructions to the prompt
            $("#prompt").html(trial.prompt_predictions);

            // finishing on key press
            var after_prediction = function(info) {

                all_inputs_in = [];
                for (var arm = 0; arm < trial.no_arms; arm ++) {
                    if (arm_inputs_idx[arm]) {
                        all_inputs_in.push(arm_inputs_OK[arm])}
                }
                if (debug) console.log("all_inputs_in: ", all_inputs_in)
                if (all_inputs_in.every(Boolean)) {
                    // if all arms OK, save data and end trial 
                    // updating the balance 
                    if (debug) console.log("earn_pred: ", earn_pred)
                    var prob_vector = [];
                    var sum_arm_conf = sum(arm_conf);
                    for (var i = 0; i < arm_conf.length; i++) {
                        prob_vector.push(arm_conf[i] / sum_arm_conf);
                    }
                    if (debug) console.log("prob_vector: ", prob_vector)
                    var earn_pred_selected = sample(earn_pred, prob_vector);
                    if (earn_pred_selected > 0) {
                        balance_pred += earn_pred_selected;
                    }
                    trial_data["balance_pred"] = balance_pred;
                    //earn_pred.reduce(function(a, b) { return a + b; }, 0);

                    // saving data
                    trial_data["predictionRT"] = pred_RT;
                    trial_data["predictions"] = arm_pred;
                    if (trial.ask_confidence) trial_data["confidence"] = arm_conf;

                    // show feedback ot ending the trial
                    if (trial.ask_predictions === 1) {
                        display_element.html('');
                        show_feedback(chosen_arm, timeout)
                    } else if (trial.ask_predictions === 2) {
                        display_element.html('');
                        end_trial(timeout);
                    }
                } 
            }

            
            jsPsych.pluginAPI.getKeyboardResponse({
              callback_function: after_prediction,
              valid_responses: trial.continue_key,
              rt_method: 'date',
              persist: true,
              allow_held_key: false
            });

        }
        
        // defining timing_stim related function
        function countdown() {
            var elem = document.getElementById("show_time_trial"); 
            //var time_remaining = trial.timing_stim;
            var id = setInterval(frame, 1000);
            function frame() {
                if (time_left <= 0) {
                    clearInterval(id);
                    time_left = 0;
                } else {
                    time_left -= 1000; 
                    var time_html = parseFloat(time_left/1000).toFixed(0)
                    elem.innerHTML = trial.show_time_trial + time_html;
                }
            }
        }


        // -------------------------------------------------------------
        // Executing the trial
        // -------------------------------------------------------------

        // if any trial variables are functions
        // this evaluates the function and replaces
        // it with the output of the function
        trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

        // this array holds handlers from setTimeout calls
        // that need to be cleared if the trial ends early
        var set_timeout_handlers = [];

        // some variables needed by all parts
        var arm_values = rep(" ", trial.no_arms);
        var time_left = trial.timing_stim;
        var trial_data = {};

        // defining variables based on default values for the 1st trial 
        if (trials_completed === 0) {
            balance = balance + trial.initial_balance;
        } 

        if (debug) console.log("Trial object: ",trial)


        // ----
        // Presenting the stimulus
        // ----
        
        // adding optional classes specified in stimuli of each arm 
        present_stimuli();

        // start measuring RT, needed for the mouse method
        var start_time = (new Date()).getTime();

        // show decreasing time if instructed
        if (trial.show_time_trial && trial.timing_stim > 0) {
            countdown()
        }; 
        

        // ----
        // Awaiting for the response
        // ----
                          
        // check if allowed manipulation key is 'mouse', or some keys
        if (trial.choice_key === 'mouse') {

            if (!trial.is_html) {
                var helpVar = '.arm_img';
            } else {
                var helpVar = '.arm';
            }

            // animating arms when mouse is hovering over them
            $(helpVar).hover( function() {
                if(!trial.is_html) {
                    $(this).toggleClass("highlighted_arm_img");
                } else {
                    $(this).toggleClass("highlighted_arm");
                };
            });

            // choice is made when an arm is clicked on
            $(helpVar).click(function() {
                var rt = (new Date()).getTime() - start_time;
                var armID = this.getAttribute('id');
                var chosen_arm = armID.split("_")[1];
                if (debug) console.log("Chosen arm: ", chosen_arm)
                after_response({key: chosen_arm, rt: rt});
            })
        } else {
            jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: after_response,
                valid_responses: trial.choice_key,
                rt_method: 'date',
                persist: false,
                allow_held_key: false
            });
        };

        // How long to show the stimulus for (milliseconds). 
        // If -1, then the stimulus is shown until a response is given.
        if (trial.timing_stim > 0) {
            set_timeout_handlers.push(setTimeout(function() {
                after_response({key:-1,rt:-1});
            }, trial.timing_stim));
        };
        
    };  // trial element defined 
                  
    return plugin;

})();
