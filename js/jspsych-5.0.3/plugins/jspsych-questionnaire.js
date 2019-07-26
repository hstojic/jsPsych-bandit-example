/**
 * jspsych-questionnaire
 * a jspsych plugin for...............
 *
 * Hrvoje Stojic
 * 
 * documentation: https://github.com/hstojic/.............
 *
 */


jsPsych.plugins['questionnaire'] = (function() {

    var plugin = {};

    plugin.trial = function(display_element, trial) {
        
        // defaults
        trial.instructions = (typeof trial.instructions === 'undefined') ? '' : trial.instructions;
        trial.numbered = (typeof trial.numbered === 'undefined') ? true : trial.numbered;
        trial.noQuestions = Object.keys(trial.questions).length;

        // if any trial variables are functions
        // this evaluates the function and replaces
        // it with the output of the function
        //trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

        // add main div
        display_element.append($('<div>', {
            "id": 'jspsych-questionnaire'
        }));

        // add optional text above the questions
        if (trial.instructions) {
            // create div
            $("#jspsych-questionnaire").append($('<div>', {
                "id": 'jspsych-questionnaire-preamble',
                "class": 'jspsych-questionnaire-preamble'
            }));

            // add the text
            $("#jspsych-questionnaire-preamble").append(trial.instructions);
        }
        
        // add questions, depending on the type
        for (var i = 0; i < trial.noQuestions; i++) {
            // create div
            $("#jspsych-questionnaire").append($('<div>', {
                "id": 'jspsych-questionnaire-' + i,
                "class": 'jspsych-questionnaire-question'
            }));

            // add question text
            if (trial.numbered) { 
                var numbering = (i+1) + '. ';
            } else {
                var numbering = "";
            }
            $("#jspsych-questionnaire-" + i).append('<p class="jspsych-questionnaire">'+ numbering + trial.questions[i].questText + '</p>');

            // add text box     
            if (trial.questions[i].questType[0] === "text") {
                
                // single or multiline
                if (trial.questions[i].questType[1] === "single") {
                    $("#jspsych-questionnaire-" + i).append('<input type="text" name="#jspsych-questionnaire-response-' + i + '"></input>');
                } else if (trial.questions[i].questType[1] === "multi") {
                    $("#jspsych-questionnaire-" + i).append('<textarea cols="40" rows="5" name="#jspsych-questionnaire-response-' + i + '"></textarea>');
                }

            // multiple choice, radio, checkbox or dropdown
            } else if (trial.questions[i].questType[0] === "multiple choice") {
                
                // radio buttons
                if (trial.questions[i].questType[1]==="radio") {
                    // adding as many radio buttons as there are options
                    for (var j=0; j<trial.questions[i].questChoice.length; j++) {
                        $("#jspsych-questionnaire-" + i).append('<label class="radio-inline"><input type="radio" name="radios_' + i + '" value="option_' + j + '"></input>' + trial.questions[i].questChoice[j] + '</label>');
                    }
                
                // checkboxes
                } else if (trial.questions[i].questType[1]==="checkbox") {
                    for (var j=0; j<trial.questions[i].questChoice.length; j++) {
                        $("#jspsych-questionnaire-" + i).append('<label class="checkbox-inline"><input type="checkbox" name="checkboxes_' + i + '" value="option_' + j + '"></input>' + trial.questions[i].questChoice[j] + '</label>');
                    }

                // or dropdown
                } else if (trial.questions[i].questType[1]==="dropdown") {
                    var choices = '';
                    for (var j=0; j<trial.questions[i].questChoice.length; j++) {
                        choices = choices + '<option value="option_' + j + '">' + trial.questions[i].questChoice[j] + '</option>';
                    }
                    $("#jspsych-questionnaire-" + i).append('<select id="#dropdown_' + i + '"><option value="void">Choose your answer</option>' + choices + '</select>');
                }
            }
        }

        // add submit button
        $("#jspsych-questionnaire").append($('<button>', {
            'id': 'jspsych-questionnaire-next',
            'class': 'jspsych-questionnaire btn btn-default'
        }));
        $("#jspsych-questionnaire-next").html('Submit answers');
        $("#jspsych-questionnaire-next").click(function() {
            // measure response time
            var endTime = (new Date()).getTime();
            var response_time = endTime - startTime;

            // create object to hold responses
            var question_data = {};
            $("div.jspsych-questionnaire-question").each(function(index) {
                var id = "Q" + index;

                // add text box     
                if (trial.questions[index].questType[0] === "text") {
                    // single or multiline
                    if (trial.questions[index].questType[1] === "single") {
                        var val = $(this).children('input').val();
                    } else if (trial.questions[index].questType[1] === "multi") {
                        var val = $(this).children('textarea').val();
                    }
                } else if (trial.questions[index].questType[0] === "multiple choice") {
                
                    // radio buttons
                    if (trial.questions[index].questType[1]==="radio") {
                        // we loop over buttons until one is checked
                        var radios = document.getElementsByName('radios_'+index);
                        for (var i = 0, length = radios.length; i < length; i++) {
                            if (radios[i].checked) {
                                var help = radios[i].value;
                                var idx = parseFloat(help.split("_")[1]);
                                var val = trial.questions[index].questChoice[idx];
                                break;
                            }
                        }
                    
                    // checkboxes
                    } else if (trial.questions[index].questType[1]==="checkbox") {
                        // we loop over buttons until one is checked
                        var checkboxes = document.getElementsByName('checkboxes_'+index);
                        var val = [];
                        for (var i = 0, length = checkboxes.length; i < length; i++) {
                            if (checkboxes[i].checked) {
                                var help = checkboxes[i].value;
                                var idx = parseFloat(help.split("_")[1]);
                                val.push(trial.questions[index].questChoice[idx]);
                            }
                        }

                    // or dropdown
                    } else if (trial.questions[index].questType[1]==="dropdown") {
                        var e = document.getElementById("#dropdown_"+index);
                        var val = e.options[e.selectedIndex].text;
                    }
                }
                
                var obje = {};
                obje[id] = val;
                $.extend(question_data, obje);
            });
            
            if (trial.check_fn && !trial.check_fn(display_element, question_data)) return;

            // save data
            var trialdata = {
              "rt": response_time,
              "responses": JSON.stringify(question_data)
            };

            display_element.html('');

            // next trial
            jsPsych.finishTrial(trialdata);
        });

        var startTime = (new Date()).getTime();
    };

    return plugin;
})();

