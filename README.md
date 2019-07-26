# (Contextual) multi-armed bandit experiment example

This repository is a simple example of Javascript based experiment for collecting behavioural data. It relies on [jsPsych](https://www.jspsych.org/) library and a plugin I have developed for that library for multi-armed bandit experiments (can be found at: )

Note, I rely on an older version of jsPsych library ([5.03](https://github.com/jspsych/jsPsych/releases/tag/v5.0.3)). jsPsych has been changing a lot in recent years, often breaking backward compatibility. I didn't have time to update the plugin yet to align it with the new jsPsych version. 

You will need at least some coding skills, basic HTML/Javascript. Even for a basic experiment, most likely you will have to get your hands dirty and do some Javascript coding, adapt CSS etc. I tried to make the plugin fairly general, allowing for options that I did not end up using, but admittedly I have not thoroughly tested everything. If you run into problems, drop me a message, I might be able to help, otherwise feel free to dive into the plugin code.

Since this was a product of my research efforts, I would be grateful if you would cite the article(s) listed below if you end up using the code in your research.


## Instructions

There are two examples:  
1. Barebones `js/exp-simple.js` that is automatically loaded if you open `index.html` in your browser. This is showing a basic version, you would still need to develop a lot of code to make it into a real experiment.  
2. A more developed example at `js/exp-full.js` based on actual contextual bandit experiments I have ran (see references below). It includes some instructions, useful functions for showing performance and earnings reports etc. Running this one is slightly more involved, see below.  


To try out `exp-full.js` first open `index.html` file, comment line 39 and comment out line 40.

Then you can use a simple Python based server to serve the experiment (this allows loading instructions etc):

With Python 3.x you can use:  

```python
python3 -m http.server 8000 --bind 127.0.0.1 
```

With Python 2.x

```python
python -m SimpleHTTPServer 8000
```

Then you can navigate your browser to `http://localhost:8000/` and it should show the experiment correctly. Read the official documentation for more details on setting up a simple server in Python.

Data storage is the tricky bit and you won't find it here. I deployed the experiment on Amazon Mechanical Turk, hosting the experiment on AWS server and using [psiturk](https://psiturk.readthedocs.io/en/latest/) library to automatize things. Psiturk has a neat feature that it takes care of the storage, so I didn't have to worry too much about it. Probably it would be useful to provide an example that integrates jsPsych with Psiturk, but it is not a good entry point for someone starting out with online experiments. I might put it in a separate repository in the future, or drop me a message if you really want to jump immediately there. 


## References

- **Hrvoje Stojic**, Eric Schulz, Pantelis P. Analytis, & Maarten Speekenbrink. "It's new, but is it good? How generalization and uncertainty guide the exploration of novel options". [[PsyArXiv preprint, pdf]](https://psyarxiv.com/p6zev)  
- **Hrvoje Stojic**, Pantelis P. Analytis & Maarten Speekenbrink (2015). "Human behavior in contextual multi-armed bandit problems". In: Proceedings of the 37th Annual Conference of the Cognitive Science Society. Austin, TX, US: Cognitive Science Society, 2290-2295. [[pdf]](https://mindmodeling.org/cogsci2015/papers/0394/paper0394.pdf) [[data]](http://dx.doi.org/10.6084/m9.figshare.1314099)