import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import _ from 'lodash';
import UserWalletSummary from '../wallet/UserWalletSummary';
import { SBD, STEEM } from '../../common/constants/cryptos';
import { getUserDetailsKey } from '../helpers/stateHelpers';
import UserWalletTransactions from '../wallet/UserWalletTransactions';
import Loading from '../components/Icon/Loading';
import {
  getUser,
  getAuthenticatedUser,
  getAuthenticatedUserName,
  getTotalVestingShares,
  getTotalVestingFundSteem,
  getUsersTransactions,
  getUsersTokenTransactions,
  getUsersAccountHistory,
  getUsersAccountHistoryLoading,
  getLoadingGlobalProperties,
  getLoadingMoreUsersAccountHistory,
  getUserHasMoreAccountHistory,
  getCryptosPriceHistory,
  getUsersTearDrops,
} from '../reducers';
import {
  getGlobalProperties,
  getUserAccountHistory,
  getMoreUserAccountHistory,
  getUserTearDrops,
} from '../wallet/walletActions';
import { getAccount } from './usersActions';

@withRouter
@connect(
  (state, ownProps) => ({
    user:
      ownProps.isCurrentUser || ownProps.match.params.name === getAuthenticatedUserName(state)
        ? getAuthenticatedUser(state)
        : getUser(state, ownProps.match.params.name),
    authenticatedUserName: getAuthenticatedUserName(state),
    totalVestingShares: getTotalVestingShares(state),
    totalVestingFundSteem: getTotalVestingFundSteem(state),
    usersTransactions: getUsersTransactions(state),
    usersTokenTransactions: getUsersTokenTransactions(state),
    usersAccountHistory: getUsersAccountHistory(state),
    usersAccountHistoryLoading: getUsersAccountHistoryLoading(state),
    loadingGlobalProperties: getLoadingGlobalProperties(state),
    loadingMoreUsersAccountHistory: getLoadingMoreUsersAccountHistory(state),
    userHasMoreActions: getUserHasMoreAccountHistory(
      state,
      ownProps.isCurrentUser
        ? getAuthenticatedUserName(state)
        : getUser(state, ownProps.match.params.name).name,
    ),
    cryptosPriceHistory: getCryptosPriceHistory(state),
    totalTearDrops: getUsersTearDrops(state),
  }),
  {
    getGlobalProperties,
    getUserAccountHistory,
    getMoreUserAccountHistory,
    getAccount,
    getUserTearDrops,
  },
)
class Wallet extends Component {
  static propTypes = {
    location: PropTypes.shape().isRequired,
    totalVestingShares: PropTypes.string.isRequired,
    totalVestingFundSteem: PropTypes.string.isRequired,
    user: PropTypes.shape().isRequired,
    getGlobalProperties: PropTypes.func.isRequired,
    getUserAccountHistory: PropTypes.func.isRequired,
    getMoreUserAccountHistory: PropTypes.func.isRequired,
    getAccount: PropTypes.func.isRequired,
    getUserTearDrops: PropTypes.func.isRequired,
    usersTransactions: PropTypes.shape().isRequired,
    usersTokenTransactions: PropTypes.shape().isRequired,
    usersAccountHistory: PropTypes.shape().isRequired,
    cryptosPriceHistory: PropTypes.shape().isRequired,
    usersAccountHistoryLoading: PropTypes.bool.isRequired,
    loadingGlobalProperties: PropTypes.bool.isRequired,
    loadingMoreUsersAccountHistory: PropTypes.bool.isRequired,
    userHasMoreActions: PropTypes.bool.isRequired,
    isCurrentUser: PropTypes.bool,
    authenticatedUserName: PropTypes.string,
    totalTearDrops: PropTypes.string.isRequired,
  };

  static defaultProps = {
    isCurrentUser: false,
    authenticatedUserName: '',
  };

  componentDidMount() {
    const {
      totalVestingShares,
      totalVestingFundSteem,
      usersTransactions,
      user,
      isCurrentUser,
      authenticatedUserName,
      totalTearDrops,
    } = this.props;
    const username = isCurrentUser
      ? authenticatedUserName
      : this.props.location.pathname.match(/@(.*)(.*?)\//)[1];

    if (_.isEmpty(totalVestingFundSteem) || _.isEmpty(totalVestingShares)) {
      this.props.getGlobalProperties();
    }

    if (_.isEmpty(usersTransactions[getUserDetailsKey(username)])) {
      this.props.getUserAccountHistory(username);
    }

    if (_.isEmpty(user)) {
      this.props.getAccount(username);
    }

    if (_.isEmpty(totalTearDrops)) {
      this.props.getUserTearDrops(username);
    }
  }

  render() {
    const {
      user,
      totalVestingShares,
      totalVestingFundSteem,
      totalTearDrops,
      loadingGlobalProperties,
      usersTransactions,
      usersTokenTransactions,
      usersAccountHistoryLoading,
      loadingMoreUsersAccountHistory,
      userHasMoreActions,
      usersAccountHistory,
      cryptosPriceHistory,
    } = this.props;

    const userKey = getUserDetailsKey(user.name);
    const tokenTransactions = _.get(usersTokenTransactions, userKey, []);
    const walletTransactions = _.get(usersTransactions, userKey, []);
    const actions = _.get(usersAccountHistory, userKey, []);
    const currentSteemRate = _.get(
      cryptosPriceHistory,
      `${STEEM.symbol}.priceDetails.currentUSDPrice`,
      null,
    );
    const currentSBDRate = _.get(
      cryptosPriceHistory,
      `${SBD.symbol}.priceDetails.currentUSDPrice`,
      null,
    );
    const steemRateLoading = _.isNull(currentSteemRate) || _.isNull(currentSBDRate);
    const transactions = tokenTransactions
      .concat(walletTransactions)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
      <div>
        <UserWalletSummary
          user={user}
          loading={user.fetching}
          totalVestingShares={totalVestingShares}
          totalVestingFundSteem={totalVestingFundSteem}
          loadingGlobalProperties={loadingGlobalProperties}
          steemRate={currentSteemRate}
          sbdRate={currentSBDRate}
          steemRateLoading={steemRateLoading}
          totalTearDrops={totalTearDrops}
        />
        {transactions.length === 0 && usersAccountHistoryLoading ? (
          <Loading style={{ marginTop: '20px' }} />
        ) : (
          <UserWalletTransactions
            transactions={transactions}
            actions={actions}
            currentUsername={user.name}
            totalVestingShares={totalVestingShares}
            totalVestingFundSteem={totalVestingFundSteem}
            getMoreUserAccountHistory={this.props.getMoreUserAccountHistory}
            loadingMoreUsersAccountHistory={loadingMoreUsersAccountHistory}
            userHasMoreActions={userHasMoreActions}
          />
        )}
      </div>
    );
  }
}

export default Wallet;
