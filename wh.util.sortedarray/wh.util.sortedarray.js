/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
/*! REQUIRE: frameworks.mootools.core
!*/

(function()
{
  /** @short SortedArray
      @long The SortedArray is an Array which keeps its elements sorted by some ordering. It uses a comparison function when
            inserting new elements, to ensure the elements in the array stay ordered. It offers the same functionality as
            Array, but mutator functions have been overridden to keep the elements ordered. Setting elements directly will
            result in a possibly unordered array, but the sort method can be used to order the elements again.

            The comparator property is set to the comparison function, which is called to sort the elements. By default, the
            objects in the array are sorted lexicographically by their string representations. The comparator property can be
            set to any function which accepts two arguments and returns a negative value when the first object should be
            sorted before the second object, a positive value when the second should be sorted before the first, or 0 when
            the objects are equal (in which case they are sorted on insertion order). After updating the comparator property,
            the array should be sorted again by calling the sort method.

            This class be also be used for priority queues, for example by adding objects with a priority property and
            supplying a comparator which compares the priority properties.
  */
  SortedArray = new Class(
  { Extends: Array

  , initialize: function()
    {
      // Set the default comparison function
      this.comparator = SortedArray.defaultComparator;

      // Default constructor arguments
      if (arguments.length == 1 && typeOf(arguments[0]) == "number")
        ;//ADDME: Create empty array?
      else if (arguments.length >= 1)
        this.push.apply(this, arguments);
    }

  , append: function(objs)
    {
      // Let push insert the new elements into the array
      this.push.apply(this, objs);
    }

  , clone: function()
    {
      // Create a new SortedArray and populate it with this array
      var result = new SortedArray();
      result.comparator = this.comparator;
      result.append(this);
      return result;
    }

  , combine: function(objs)
    {
      // Let include insert the new elements into the array, to prevent duplicates
      objs.each(function(obj)
      {
        this.include(obj);
      }, this);
    }

  , filter: function()
    {
      // Create a new SortedArray and fill it with the filtered results
      var result = new SortedArray();
      result.comparator = this.comparator;
      result.append(this.parent.apply(this, arguments));
      return result;
    }

  , flatten: function()
    {
      // First flatten the array as usual, then sort the elements again
      this.parent();
      this.sort();
    }

  , include: function(obj)
    {
      // Let push insert the new element into the array if it's not already present
      if (this.indexOf(obj) < 0)
        this.push(obj);
    }

  , pop: function()
    {
      // Return the front of the queue
      return this.shift();
    }

  , push: function()
    {
      // Let splice add the new elements, without removing any existing elements
      var objs = Array.slice(arguments);
      objs.unshift(0, 0);
      this.splice.apply(this, objs);
    }

  , reverse: function()
    {
      // We cannot reverse, just fall back to sort
      this.sort();
    }

  , sort: function()
    {
      // Always sort using our comparison function
      this.parent(this.comparator);
    }

  , splice: function(index, howMany)
    {
      // Remove the requested elements
      this.parent(index, howMany);

      // Insert the new elements
      Array.each(arguments, function(obj, i)
      {
        // Skip the 'index' and 'howMany' arguments
        if (i < 2)
          return;

        // Find the new element's position (insert it before the first element that should be sorted after this element, so
        // elements that are equal will be sorted chronologically)
        for (var pos = 0; pos < this.length && this.comparator(obj, this[pos]) >= 0; ++pos);
        // Insert the new element
        this.parent(pos, 0, obj);
      }, this);
    }

  , unshift: function()
    {
      // Let push insert the new elements into the array
      this.push.apply(this, arguments);
    }

    /** Find the insert position for the given item within the array without actually inserting it
    */
  , lowerBound: function(obj)
    {
      var curstart = 0, curlimit = this.length;
      var segmentsize = curlimit - curstart;
      while (segmentsize > 0)
      {
        var half = parseInt(segmentsize / 2);
        var middle = curstart + half;

        if (this.comparator(this[middle], obj) < 0)
        {
          curstart = middle + 1;
          segmentsize = segmentsize - half - 1;
        }
        else
        {
          segmentsize = half;
        }
      }
      return curstart;
    }

  });

  /** The default SortedArray comparator, which converts both arguments to string and does a simple string comparison. */
  SortedArray.defaultComparator = function(obj1, obj2)
  {
    var str1 = typeOf(obj1) != "null" ? obj1.toString() : "null";
    var str2 = typeOf(obj2) != "null" ? obj2.toString() : "null";
    return str1 < str2 ? -1 : str1 > str2 ? 1 : 0;
  }

  /** The localeComparator converts both arguments to string and does a locale-aware string comparison. */
  SortedArray.localeComparator = function(obj1, obj2)
  {
    var str1 = typeOf(obj1) != "null" ? obj1.toString() : "null";
    var str2 = typeOf(obj2) != "null" ? obj2.toString() : "null";
    return str1.localeCompare(str2);
  }

  /** The numericalComparator tries to convert both arguments to a numerical value and compares accordingly. */
  SortedArray.numericalComparator = function(obj1, obj2)
  {
    var val1 = typeOf(0 + obj1) == "number" ? obj1 : NaN;
    var val2 = typeOf(0 + obj2) == "number" ? obj2 : NaN;
    return val1 - val2;
  }

})();
