from mongoengine import *
from flask import Flask, render_template, redirect, url_for
import json
from collections import namedtuple
from pymongo import MongoClient
import os
import csv
from flask import jsonify
from flask_cors import CORS
from flask import request

app = Flask(__name__)
CORS(app)
app.config.from_object('config')


connect('country')
client = MongoClient()
db = client.country

class Country(Document):
    name = StringField()
    data = DictField()    

@app.route('/readcountries')
def read_country():
    for file in os.listdir(app.config['FILES_FOLDER']):
        filename = os.fsdecode(file)
        path = os.path.join(app.config['FILES_FOLDER'],filename)
        with open(path) as csvfile:
            reader = csv.DictReader(csvfile) 
            d = list(reader)
            for data in d:
                country = Country() # a blank placeholder country
                dict = {} # a blank placeholder data dict
                for key in data: # iterate through the header keys
                    if key == "country":
                        # check if this country already exists in the db
                        country_exists = db.country.find({"name" :data.get(key)}).count() > 0
                        
                        # if the country does not exist, we can use the new blank country we created above, and set the name
                        if not country_exists:
                            country.name = data.get(key)
                        # if the country already exists, replace the blank country with the existing country from the db, 
                        # and replace the blank dict with the current country's data 
                        else:
                            country = Country.objects.get(name = data.get(key))
                            dict = country.data
                    else:
                        f = filename.replace(".csv","") # we want to trim off the ".csv" as we can't save anything with a "." as a mongodb field name
                        if f in dict: # check if this filename is already a field in the dict
                            dict[f][key] = data[key] # if it is, just add a new subfield which is key : data[key] (value)
                        else:
                            dict[f] = {key:data[key]} # if it is not, create a new object and assign it to the dict

                    # add the data dict to the country
                    country.data = dict

                # save the country
                country.save()
    return redirect(url_for("index"))

@app.route('/countries', methods=['GET'])
@app.route('/countries/<country_name>', methods=['GET'])
def get_country(country_name=None):
    if country_name is None:
        countries_list = db.country.distinct('name')
        return jsonify({"countries":countries_list})
    
    else:
        try:
            country_data = Country.objects.get(name = country_name)
            return country_data.to_json()
        except:
            return "Country not found"

@app.route('/')
def index():
    return render_template("base.html", title = "Home", page="home")

@app.route('/inspiration')
def inspiration():
    return render_template("inspiration.html", title = "Inspirations", page="inspiration")

@app.route("/data")    
def country_data():
    countries_list = db.country.distinct('name')
    return render_template("data.html", title = "Data", page = "data", countries_data = countries_list)   


@app.route('/countries/edit')
def edit():
    countries_list = db.country.distinct('name')
    return render_template("edit.html", title = "edit", countries_data = countries_list)

@app.route('/countries/delete')
def delete():
    countries_list = db.country.distinct('name')
    return render_template("delete.html", title = "delete", countries_data = countries_list)    

@app.route('/countries/edit/country', methods=['POST'])
def edit_country():
    country_name = request.form['country']
    rename_country = request.form['rename_country']
    myquery = { "name": country_name }
    newvalues = { "$set": { "name": rename_country } }

    db.country.update_one(myquery, newvalues)
    countries_list = db.country.distinct('name')
    return render_template("edit.html", title = "edit", countries_data = countries_list) 

@app.route('/countries/delete/country', methods=['POST'])
def delete_country():
    country_name = request.form['country']
    myquery = { "name": country_name }

    db.country.delete_one(myquery)
    countries_list = db.country.distinct('name')
    return render_template("delete.html", title = "delete", countries_data = countries_list)     

# 404 error handler
@app.errorhandler(404) 
def page_not_found_404(e):
  return render_template('404.html', title = "Error", error = e), 404
  
# 500 error handler
@app.errorhandler(500) 
def page_not_found_500(e):
  return render_template('500.html', title = "Error", error = e), 500    

if __name__ =="__main__":
    app.run(debug=True, port=8080, host='0.0.0.0')
