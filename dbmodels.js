var sqlite = require('sqlite3'),
		Sequelize = require('sequelize'),
		connection_string = process.env['DATABASE_URL'],
		DB = connection_string
					?	new Sequelize(connection_string)
					: new Sequelize(process.env['DATABASE_NAME'] || 'enjp',
													process.env['DATABASE_USER'] || null,
													process.env['DATABASE_PASS'] || null,
													{dialect: 'sqlite', storage: process.env['DATABASE_NAME'] || 'enjp'});
		Db = {
			"Poem": {},
			"Line": {},
			"DB": DB,
			"initializeModels": function initializeModels(cb) {
				this.Poem = DB.define('Poem', {
					id: 		{type: Sequelize.INTEGER, primaryKey:true},
					title: 		Sequelize.STRING,
					author: 	Sequelize.STRING,
					lang:			Sequelize.STRING
				}, {timestamps: false});

				this.Line = DB.define('Line', {
					id: 		{type: Sequelize.INTEGER, primaryKey:true, autoIncrement: true},
					en:		Sequelize.STRING,
					jp:		Sequelize.STRING,
					lang:	Sequelize.STRING,
					line_no: 	Sequelize.INTEGER
				}, {timestamps: false});

				this.Poem.hasMany(this.Line, {primaryKey: "poem_id"});

				//Make callback (with DB model or with error)
				DB.sync().success(cb).error(cb);
                                return DB;
			}
		};
                Db.initialize_models = Db.initializeModels;


module.exports = Db;