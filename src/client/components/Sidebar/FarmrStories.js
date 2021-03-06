import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Modal, Select } from 'antd';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import {
  getFarmrsFollowingList,
} from '../../reducers';
import FarmrStory from './FarmrStory';
import Loading from '../../components/Icon/Loading';
import { farmrStoriesTags } from '../../helpers/constants';
import steemAPI from '../../steemAPI';
import SteemConnect from '../../steemConnectAPI';
import './InterestingPeople.less';
import './SidebarContentBlock.less';
import FarmrStoryEditor from '../FarmrStoryEditor/FarmrStoryEditor';

@withRouter
@connect(
  state => ({
    certifiedFarmrs: getFarmrsFollowingList(state),
  }),
)
class FarmrStories extends React.Component {
  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    authenticatedUser: PropTypes.shape({
      name: PropTypes.string,
    }),
    location: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    isFetchingFollowingList: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    authenticated: false,
    authenticatedUser: {
      name: '',
    },
  };

  constructor(props) {
    super(props);

    this.state = {
      certifiedFarmrNames: [],
      certifiedFarmrs: [],
      farmrStoriesObj: {},
      farmrStoriesArr: [],
      loading: true,
      showModalLogin: false,
      displayStories: 0,
    };

    this.getFarmrStories = this.getFarmrStories.bind(this);
    this.showModal = this.showModal.bind(this);
    this.modalHandleOk = this.modalHandleOk.bind(this);
  }

  showModal(){
    const {showModalLogin} = this.state;
    this.setState({
      showModalLogin: !showModalLogin
    })
  }

  componentDidMount() {
    this.getFarmrStories();
  }

  getFarmrStories() {
    steemAPI
      .sendAsync('call', ['follow_api', 'get_following', ['farmrs', '', 'blog', 100]])
      .then(result => {

        // get certified farmr names
        const certifiedFarmrNames = _.sortBy(result, 'following')
          .map(user => {
            let name = _.get(user, 0);

            if (_.isEmpty(name)) {
              name = _.get(user, 'following');
            }
            return name;
          });

        // if there are certified farmrs
        if (certifiedFarmrNames.length > 0) {
          // get the latest posts from each certified farmr
          certifiedFarmrNames.forEach(userName => {
            var query = {
              tag: userName, // Filter the results by a specific post author
              limit: 5, // Limit the number of posts returned
            };
            this.setState({
              loading: true,
            });

            steemAPI
              .sendAsync('call', ['condenser_api', 'get_discussions_by_blog', [query]])
              .then(result  => {
                const posts = Array.isArray(result) ? result : [];
                const post = posts[0];
                this.setState({
                  loading: false,
                });

                // filter-out posts from non-certified users
                if(certifiedFarmrNames.indexOf(post.author) < 0) return;

                // filter posts that have been created more than 3 days ago
                const today = new Date();
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(today.getDate() - 3);
                const created = new Date(post.created);
                if(created < threeDaysAgo) return;

                // Add 'farmr' and 'farmr' as valid farmr story tags
                farmrStoriesTags.push('farmr', 'farmr');
                // filter posts that do not contain valid farmr tags
                let containsFarmrTag = false;
                farmrStoriesTags.forEach(subtag => {
                  const tags = JSON.parse(post.json_metadata).tags;
                  if (tags.indexOf(subtag) >= 0) {
                    containsFarmrTag = true;
                  }
                })
                if (!containsFarmrTag) return;

                // push post to farmr stories array
                let { farmrStoriesArr } = this.state;
                farmrStoriesArr.push(
                  {
                    author: post.author,
                    permlink: post.permlink,
                    created: post.created
                  }
                );

                // set farmr stories to state
                // set loading and no users to false to display farmr stories
                this.setState({
                  farmrStoriesArr,
                });
              });

          });

          // set the initial list to display the first 5 farmr stories
          this.setState({ displayStories: 5 });

        }
      });
  }

  modalHandleOk(){
    const showModalLogin = this.state;
    this.setState({
      showModalLogin : !showModalLogin
    })
  }

  handleLoadMore = () => {
    const { displayStories } = this.state;
    this.setState({ displayStories: displayStories + 5 });
  };

  render() {
    const { farmrStoriesArr, loading, showModalLogin, displayStories } = this.state;
    // sort farmr stories by descending created date
    farmrStoriesArr.sort((a, b) => {
      var keyA = new Date(a.created),
          keyB = new Date(b.created);
      if(keyA > keyB) return -1;
      if(keyA < keyB) return 1;
      return 0;
    });

    const slicedFarmrStories = farmrStoriesArr.slice(0, displayStories);
    const { authenticated, location } = this.props;
    const hasMoreStories = (displayStories < farmrStoriesArr.length);
    const next = location.pathname.length > 1 ? location.pathname : '';

    if (loading) {
      return <Loading />;
    }

    return (
      <div className="SidebarContentBlock">
        <h4 className="SidebarContentBlock__title">
          <i className="iconfont icon-group SidebarContentBlock__icon" />{' '}
          <FormattedMessage id="farmr_stories" defaultMessage="Farmr Stories" />
        </h4>
        <div className="SidebarContentBlock__content" style={{ textAlign: 'center' }} >
          {authenticated ? (
            <Button onClick={this.showModal} type="primary" shape="circle" icon="plus-circle" size={'large'} style={{ float: 'left' }} />
          ) : (
            <Button href={SteemConnect.getLoginURL(next)} type="primary" shape="circle" icon="plus-circle" size={'large'} style={{ float: 'left' }} />
          )}
          <div style={{ fontWeight: 'bold', paddingTop: 10 }}>Add A Farmr-Story</div>
          <br/>
          <div style={{ textAlign: 'left', padding: 3 }}>
            Share images, photography, graphics, farmr-news, farmr-arts plain text etc freshly-created by you, today.
          </div>
          {slicedFarmrStories.map(story =>
            <FarmrStory key={story.permlink} story={{ author: story.author, permlink: story.permlink }} />
          )}
          {hasMoreStories &&
            <Button onClick={this.handleLoadMore} type="primary">
              View More
            </Button>
          }
        </div>
        <Modal
          title={
            <FormattedMessage
              id="farmr_story_quick_post_title"
              defaultMessage="Farmr Story - Save the day! Tell us what you see; what is on your mind; what's going on around you currently..."
            />
          }
          visible={showModalLogin}
          onOk={this.modalHandleOk}
          onCancel={this.modalHandleOk}
          footer={null}
        >
          <FarmrStoryEditor />
        </Modal>
      </div>
    );
  }
}

export default FarmrStories;
