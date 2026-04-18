How to implement lifecycle methods in useEffect:

To implement componentDidMount(), pass an empty dependency array

To implement componentDidUpdate(), pass dependencies to run the useEffect if one of those dependencies changes

For componentWillUnmount(), return a callback function from useEffect containing the cleanup code