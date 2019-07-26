// generate stimuli first 
// - should be an array with an object for each trial, 
// - single trial object should contain "stimuli" array which contains 
// arm specific and shared trial parameters:
//   - "show_feedback" (0,1,2 = no feedback, partial or full feedback)
//   - optional "data" (object)
//   - "stimuli" array should contain one object for each arm, with 
//   following attributes: 
//     - "stimulus": image path or html object
//     - "value" (real): reward to give as feedback
//     - "prediction" (bool): ask prediction for this arm? 
//     - "label" (str): label of the option which appears above it
//     - "pos" (array): position in the nxn grid
//   - "data" (object): optional object with data to be saved associated 
//     with the specific arm
    
   /* 
    var stimuli_all = [
        {stimuli:[{stimulus:'<div><div class="featVertical" style="bottom:5px;left:5px;height:0.5px"/><div class="featHorizontal" style="bottom:5px;left:5px;width:0.3px"/></div>', 
                value: 20,
                pos: [1,1],
                label: "Option ",
                prediction: true},
               {stimulus:'<div><div class="featVertical" style="bottom:5px;left:5px;height:50px"/><div class="featHorizontal" style="bottom:5px;left:5px;width:3px"/></div>', 
                value: 10,
                pos: [1,2],
                label: "Option ",
                prediction: true}], 
          show_feedback:1,
          data: {name:["1","2"], noise:[0.3,0.2], value:[20,30], exp_value:[18,19]}},
        {stimuli:[{stimulus:'<div><div class="featVertical" style="bottom:5px;left:5px;height:0.5px"/><div class="featHorizontal" style="bottom:5px;left:5px;width:0.3px"/></div>', 
                value: 30,
                pos: [1,2],
                label: "Option ",
                prediction: true},
               {stimulus:'<div><div class="featVertical" style="bottom:5px;left:5px;height:0.5px"/><div class="featHorizontal" style="bottom:5px;left:5px;width:0.3px"/></div>', 
                value: 15,
                pos: [1,3],
                label: "Option ",
                prediction: false},
               {stimulus:'<div><div class="featVertical" style="bottom:5px;left:5px;height:0.5px"/><div class="featHorizontal" style="bottom:5px;left:5px;width:0.3px"/></div>', 
                value: 5,
                pos: [1,5],
                label: "Option ",
                prediction: false}], 
          show_feedback:2,
          data: {name:["1","2"], noise:[0.3,0.2], value:[20,30], exp_value:[18,19]}}
      ]
*/


// ----
// Functions for generating stimuli
// ----


var gen_bandit_stimuli = function(stim_specs, rand_feat) {

    // randomly select positions on the screen
    var all_pos = [];
    for (var i = 1; i <= stim_specs.grid_size[1]; i++){
        for (var j = 1; j <= stim_specs.grid_size[0]; j++){
          all_pos.push([i,j]);
        }
    }
    if (stim_specs.rand_pos) {
        var rand_pos = shuffle(all_pos).array.slice(0,stim_specs.no_arms + 1);
    } else {
        var rand_pos = all_pos.slice(0,stim_specs.no_arms + 1);
    }

    // shuffle the arm labels once 
    var rand_labels = shuffle(stim_specs.labels).array;

    // we draw feature values at the beginning and keep them fixed throughout
    var feat_values = [];
    for (var arm=0; arm < stim_specs.no_arms; arm++) {
        var feat_ranges = stim_specs.features[stim_specs.arm_names[arm]];
        feat_values.push([stim_specs.feat_fnc(1, feat_ranges[0][0],feat_ranges[0][1])[0], stim_specs.feat_fnc(1, feat_ranges[1][0],feat_ranges[1][1])[0]])
    }


    // go trial by trial and create stimuli
    var stim = []; 
    for (var trial=1; trial <= stim_specs.no_trial; trial++) {
        
        var stimuli = [];

        // additional data to save 
        var arm_noise = [];
        var arm_values = [];
        var arm_exp_values = [];
        var arm_names = [];
        var arm_classes = [];

        // create each arm stimulus
        for (var arm=0; arm < stim_specs.no_arms; arm++) {

            var arm_obj = {};

            // draw the noise term
            arm_noise[arm] = stim_specs.noise_fnc(stim_specs.noise_mean, stim_specs.noise_var);          

            // compute the exp value
            arm_exp_values[arm] = stim_specs.reward_fnc(stim_specs.weights, feat_values[arm]);
            arm_values[arm] = arm_exp_values[arm] + arm_noise[arm]; 
            arm_names[arm] = stim_specs.arm_names[arm];

            // create stimulus HTML 
            var val_horizontal = 0;
            var val_vertical = 0;
            if (stim_specs.bandit_type === "FMAB") {
                // randomize feature position if needed
                var feat_arm = clone(feat_values[arm]);
                if (stim_specs.rand_feat) {
                    feat_arm = shuffle(feat_arm, rand_feat).array;
                };
                var val_horizontal = Math.round(rescale(feat_arm[0],0,1,0,50));
                var val_vertical = Math.round(rescale(feat_arm[1],0,1,0,50));
            };

            var stimulus = '<div><div class="feat_vertical" style="bottom:5px;left:5px;height:' + Math.abs(val_vertical) + 'px"/><div class="feat_horizontal" style="bottom:5px;left:5px;width:' + Math.abs(val_horizontal) + 'px"/></div>';
            arm_obj["stimulus"] = stimulus;

            // add value, pos, name and prediction
            arm_obj["value"] = arm_values[arm];
            arm_obj["exp_value"] = arm_exp_values[arm];
            arm_obj["label"] = "Option " + rand_labels[arm];
            arm_obj["prediction"] = true;
            arm_obj["pos"] = rand_pos[arm];

            // add the arm stimulus object to the stimuli array 
            stimuli.push(arm_obj);
        };

        // now adding everything to a single trial object
        var trial_obj = {};
        trial_obj["stimuli"] = stimuli;
        trial_obj["show_feedback"] = 1;
        trial_obj["data"] = {
            name:arm_names,
            noise:arm_noise,
            value:arm_values,
            exp_value:arm_exp_values,
            feat_values:feat_values,
            rand_feat:rand_feat,
            rand_pos:rand_pos,
            rand_labels:rand_labels
        };

        // at the end of the trial we push the trial object into the stim array
        stim.push(trial_obj);
    }

    // finally we return the stim array
    return stim
}
