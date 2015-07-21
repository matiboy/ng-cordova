// install   :      cordova plugin add https://github.com/polychrom/cordova-android-accountmanager.git
// link      :      https://github.com/polychrom/cordova-android-accountmanager

angular.module('ngCordova.plugins.accountmanager', [])
  .provider('$cordovaAccountManager', function() {
    var defaultAccountType = null;
    this.setAccountType = function(t) {
      defaultAccountType = t;
    }

    this.$get = ['$q', '$cordovaAccountManagerStatus', function ($q, $cordovaAccountManagerStatus) {
      var service = {
        getAccounts: function (accountType) {
          var defer = $q.defer(),
              am = window.plugins.accountmanager;;
          if(!accountType) {
            accountType = defaultAccountType;
          }
          am.getAccountsByType(accountType, function(error, accounts) {
            // This could represent permissions error
            if(error) {
              return defer.reject(error);
            }
            if(!accounts || !accounts.length) {
              return defer.reject($cordovaAccountManagerStatus.NO_ACCOUNTS_OF_THIS_TYPE);
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
            return $q.reject($cordovaAccountManagerStatus.NO_MATCHING_ACCOUNT);
          });
        },

        setForKey: function (key, serviceName, value) {
          var defer = $q.defer(),
              kc = new Keychain();

          kc.setForKey(defer.resolve, defer.reject, key, serviceName, value);

          return defer.promise;
        },

        removeForKey: function (key, serviceName) {
          var defer = $q.defer(),
              kc = new Keychain();

          kc.removeForKey(defer.resolve, defer.reject, key, serviceName);

          return defer.promise;
        }
      };
    return service;
    }]
  });
