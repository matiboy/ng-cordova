// install   :      cordova plugin add https://github.com/polychrom/cordova-android-accountmanager.git
// link      :      https://github.com/polychrom/cordova-android-accountmanager

angular.module('ngCordova.plugins.accountmanager', [])
  .provider('$cordovaAccountManager', function() {
    var defaultAccountType = null;
    this.setAccountType = function(t) {
      defaultAccountType = t;
    }

    function accountOrGetAccount(account) {
      // _index is the only required property in the plugin's getUserData code
      // If not there, get the account assuming that we were given a name or a callback to identify the account
      return $q.when(account._index ? account : service.getAccount(null, account));
    }

    function needsAccountWrapper(pluginFunction, account) {
      var defer = $q.defer();
      accountOrGetAccount(account).then(function certainToHaveAccountObject(account) {
        // MDN advises against slicing arguments
        var args = [];
        for(var i=2; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        // Last argument is going to be our callback
        args.push(function(err, data) {
          if(err) {
            return defer.reject(err);
          }
          defer.resolve(data);
        });
        window.plugins.accountmanager[pluginFunction].apply(this, args);
        return defer.promise;
    }


    this.$get = ['$q', function ($q) {
      var service = {
        getAccounts: function (accountType) {
          var defer = $q.defer();
          accountType = accountType || defaultAccountType;
          window.plugins.accountmanager.getAccountsByType(accountType, function(error, accounts) {
            // This could represent permissions error
            if(error) {
              return defer.reject(error);
            }
            if(!accounts || !accounts.length) {
              return defer.reject('No account of this type');
            }
            return defer.resolve(accounts);
          });

          return defer.promise;
        },
        getAccount: function(accountType, nameOrCallback) {
          var at = accountType;
          if(arguments.length === 1) {
            nameOrCallback = accountType;
            at = null;
          }
          // Let get accounts handle the rejection
          return service.getAccounts(at).then(function(accounts) {
            var checkCallback = typeof(nameOrCallback === 'function') ? nameOrCallback : function(account) {
              return account.name === nameOrCallback;
            }
            for(var i in accounts) {
              var account = accounts[i];
              if(checkCallback(account)) {
                return account;
              }
            }
            // Failed on all accounts
            return $q.reject('No matching account');
          });
        },
        createAccount: function(accountType, name, password, data) {
          var defer = $q.defer();
          accountType = accountType || defaultAccountType;
          window.plugins.accountmanager.addAccountExplicitly(accountType, name, password, data, function(err, newAccount) {
            if(err) {
              return defer.reject(err);
            }
            defer.resolve(newAccount);
          });
          return defer.promise;
        },
        getUserData: needsAccountWrapper.bind(null, 'getUserData'),
        setUserData: needsAccountWrapper.bind(null, 'setUserData'),
        removeAccount: needsAccountWrapper.bind(null, 'removeAccount')
      };
    return service;
    }]
  });
